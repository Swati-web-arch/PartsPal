// server/src/routes/inventory.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

/**
 * GET /api/parts
 * Query params (optional):
 * - search: string (filters name case-insensitively)
 * - category: string (filters by category)
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

  // Add low-stock flag (Stretch Goal: Low-stock warnings)
  const formatted = results.map((part) => ({
    ...part,
    isLowStock: part.available <= (part.lowStockThreshold || 0)
  }));

  res.json(formatted);
});

/**
 * POST /api/parts
 * Add a new part to inventory
 * Body: { name, category, total, lowStockThreshold }
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
  res.status(201).json(newPart);
});

/**
 * GET /api/kits
 * Fetch all kits with detailed part information and how many can be issued
 */
router.get('/kits', (req, res) => {
  const detailedKits = db.kits.map((kit) => {
    // Attach part details to each item in kit
    const itemsWithDetails = kit.items.map((item) => {
      const part = db.parts.find((p) => p.id === item.partId);
      return {
        partId: item.partId,
        qty: item.qty,
        partName: part ? part.name : 'Unknown Part',
        available: part ? part.available : 0
      };
    });

    // Calculate how many complete kits can currently be assembled
    const maxCanIssue = Math.min(
      ...itemsWithDetails.map((item) => Math.floor(item.available / item.qty))
    );

    return {
      id: kit.id,
      name: kit.name,
      items: itemsWithDetails,
      canIssueCount: Math.max(0, maxCanIssue)
    };
  });

  res.json(detailedKits);
});

export default router;
