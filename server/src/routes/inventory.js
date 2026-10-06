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
  logEvent('PART_CREATED', 'oc', newPart.id, { name: newPart.name });
  res.status(201).json(newPart);
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
 * PATCH /api/kits/:id
 * OC Member can modify kit contents (e.g. add wheels, change items)
 * Body: { items: [{ partId, qty }] } or { name, items }
 */
router.patch('/kits/:id', (req, res) => {
  const kit = db.kits.find((k) => k.id === req.params.id);
  if (!kit) {
    return res.status(404).json({ error: 'Kit not found' });
  }

  const { name, items } = req.body;
  if (name) kit.name = name.trim();
  if (items && Array.isArray(items)) {
    // Validate each part exists and qty is positive integer
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
