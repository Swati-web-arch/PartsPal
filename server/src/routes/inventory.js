// server/src/routes/inventory.js
import express from 'express';
import { db, logEvent } from '../db.js';

const router = express.Router();

/**
 * GET /api/parts
 */
router.get('/parts', (req, res) => {
  const { search, category } = req.query;
  let results = [...db.parts];

  if (category && category !== 'All') {
    results = results.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (search) {
    const q = search.trim().toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(q));
  }

  const formatted = results.map((part) => ({
    ...part,
    isLowStock: part.available <= (part.lowStockThreshold || 0)
  }));

  res.json(formatted);
});

/**
 * POST /api/parts
 * Add a new part to inventory
 */
router.post('/parts', (req, res) => {
  const { name, category, total, lowStockThreshold } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Part name is required' });
  }
  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category is required' });
  }

  const parsedTotal = parseInt(total, 10);
  if (isNaN(parsedTotal) || parsedTotal <= 0) {
    return res.status(400).json({ error: 'Total count must be a positive integer' });
  }

  const parsedThreshold = lowStockThreshold !== undefined ? parseInt(lowStockThreshold, 10) : 1;

  const newPart = {
    id: `p-${Date.now()}`,
    name: name.trim(),
    category: category.trim(),
    total: parsedTotal,
    available: parsedTotal,
    lowStockThreshold: isNaN(parsedThreshold) ? 1 : parsedThreshold
  };

  db.parts.push(newPart);
  logEvent('PART_CREATED', 'oc', newPart.id, { name: newPart.name, total: newPart.total });
  res.status(201).json(newPart);
});

/**
 * PATCH /api/parts/:id
 * OC Member can update stock count or threshold
 */
router.patch('/parts/:id', (req, res) => {
  const part = db.parts.find((p) => p.id === req.params.id);
  if (!part) {
    return res.status(404).json({ error: 'Part not found' });
  }

  const { total, available, lowStockThreshold, name, category } = req.body;
  if (name) part.name = name.trim();
  if (category) part.category = category.trim();

  if (total !== undefined) {
    const parsedTotal = parseInt(total, 10);
    if (!isNaN(parsedTotal) && parsedTotal >= 0) {
      // Calculate difference to adjust available proportionally
      const diff = parsedTotal - part.total;
      part.total = parsedTotal;
      part.available = Math.max(0, part.available + diff);
    }
  }

  if (available !== undefined) {
    const parsedAvailable = parseInt(available, 10);
    if (!isNaN(parsedAvailable) && parsedAvailable >= 0) {
      part.available = Math.min(part.total, parsedAvailable);
    }
  }

  if (lowStockThreshold !== undefined) {
    part.lowStockThreshold = parseInt(lowStockThreshold, 10) || 1;
  }

  logEvent('PART_STOCK_UPDATED', 'oc', part.id, { total: part.total, available: part.available });
  res.json(part);
});

/**
 * GET /api/kits
 */
router.get('/kits', (req, res) => {
  const detailedKits = db.kits.map((kit) => {
    const itemsWithDetails = kit.items.map((item) => {
      const part = db.parts.find((p) => p.id === item.partId);
      return {
        partId: item.partId,
        qty: item.qty,
        partName: part ? part.name : 'Unknown Part',
        available: part ? part.available : 0
      };
    });

    const maxCanIssue = itemsWithDetails.length > 0
      ? Math.min(...itemsWithDetails.map((item) => Math.floor(item.available / item.qty)))
      : 0;

    return {
      id: kit.id,
      name: kit.name,
      items: itemsWithDetails,
      canIssueCount: Math.max(0, maxCanIssue)
    };
  });

  res.json(detailedKits);
});

/**
 * POST /api/kits
 * OC Member creates a new kit from scratch
 */
router.post('/kits', (req, res) => {
  const { name, items } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Kit name is required' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Kit must include at least one part' });
  }

  for (const item of items) {
    const part = db.parts.find((p) => p.id === item.partId);
    if (!part) {
      return res.status(400).json({ error: `Part ${item.partId} does not exist in inventory` });
    }
    const q = parseInt(item.qty, 10);
    if (isNaN(q) || q <= 0) {
      return res.status(400).json({ error: `Quantity for ${part.name} must be a positive integer` });
    }
  }

  const newKit = {
    id: `k-${Date.now()}`,
    name: name.trim(),
    items: items.map((it) => ({
      partId: it.partId,
      qty: parseInt(it.qty, 10)
    }))
  };

  db.kits.push(newKit);
  logEvent('KIT_CREATED', 'oc', newKit.id, { name: newKit.name, items: newKit.items });

  res.status(201).json(newKit);
});

/**
 * PATCH /api/kits/:id
 */
router.patch('/kits/:id', (req, res) => {
  const kit = db.kits.find((k) => k.id === req.params.id);
  if (!kit) {
    return res.status(404).json({ error: 'Kit not found' });
  }

  const { name, items } = req.body;
  if (name) kit.name = name.trim();
  if (items && Array.isArray(items)) {
    for (const item of items) {
      const part = db.parts.find((p) => p.id === item.partId);
      if (!part) {
        return res.status(400).json({ error: `Part ${item.partId} does not exist in inventory` });
      }
      if (!item.qty || item.qty <= 0) {
        return res.status(400).json({ error: `Quantity for ${part.name} must be a positive integer` });
      }
    }
    kit.items = items;
  }

  logEvent('KIT_UPDATED', 'oc', kit.id, { name: kit.name, items: kit.items });
  res.json(kit);
});

export default router;
