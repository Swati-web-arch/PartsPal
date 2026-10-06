// server/src/routes/issues.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

/**
 * POST /api/issues
 * Issue a single part or an entire kit to a member
 * Body options:
 * - Single part: { memberName, regNo, dueDate, type: 'part', partId, qty }
 * - Kit: { memberName, regNo, dueDate, type: 'kit', kitId }
 */
router.post('/issues', (req, res) => {
  const { memberName, regNo, dueDate, type, partId, qty, kitId } = req.body;

  // 1. Basic validation
  if (!memberName || !memberName.trim()) {
    return res.status(400).json({ error: 'Member name is required' });
  }
  if (!regNo || !regNo.trim()) {
    return res.status(400).json({ error: 'Registration number is required' });
  }
  if (!dueDate) {
    return res.status(400).json({ error: 'Due date is required' });
  }

  const cleanRegNo = regNo.trim().toUpperCase();
  const cleanMemberName = memberName.trim();

  // 2. Issuing a KIT (The Key Challenge)
  if (type === 'kit') {
    const kit = db.kits.find((k) => k.id === kitId);
    if (!kit) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    // ALL-OR-NOTHING CHECK: Check if every part in the kit has enough stock
    const shortParts = [];
    for (const item of kit.items) {
      const part = db.parts.find((p) => p.id === item.partId);
      if (!part || part.available < item.qty) {
        shortParts.push({
          partName: part ? part.name : 'Unknown Part',
          required: item.qty,
          available: part ? part.available : 0
        });
      }
    }

    // If any part is short, reject the whole issue and name the short parts
    if (shortParts.length > 0) {
      const errorMsg = shortParts
        .map((sp) => `${sp.partName} (Needs: ${sp.required}, Available: ${sp.available})`)
        .join(', ');
      return res.status(400).json({
        error: `Cannot issue kit. Insufficient stock for: ${errorMsg}`,
        shortParts
      });
    }

    // All parts are in stock! Now decrement stock for all parts
    const lines = [];
    for (const item of kit.items) {
      const part = db.parts.find((p) => p.id === item.partId);
      part.available -= item.qty;
      lines.push({
        partId: part.id,
        partName: part.name,
        qty: item.qty
      });
    }

    const newIssue = {
      id: `issue-${Date.now()}`,
      type: 'kit',
      kitId: kit.id,
      title: kit.name,
      lines,
      memberName: cleanMemberName,
      regNo: cleanRegNo,
      dueDate, // Expected return date/time
      status: 'issued',
      issuedAt: new Date().toISOString(),
      returnedAt: null
    };

    db.issues.push(newIssue);
    return res.status(201).json(newIssue);
  }

  // 3. Issuing a SINGLE PART
  if (type === 'part') {
    const issueQty = parseInt(qty, 10);
    if (isNaN(issueQty) || issueQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const part = db.parts.find((p) => p.id === partId);
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    if (part.available < issueQty) {
      return res.status(400).json({
        error: `Insufficient stock for ${part.name}. Requested: ${issueQty}, Available: ${part.available}`
      });
    }

    // Decrement available stock
    part.available -= issueQty;

    const newIssue = {
      id: `issue-${Date.now()}`,
      type: 'part',
      partId: part.id,
      title: part.name,
      lines: [
        {
          partId: part.id,
          partName: part.name,
          qty: issueQty
        }
      ],
      memberName: cleanMemberName,
      regNo: cleanRegNo,
      dueDate,
      status: 'issued',
      issuedAt: new Date().toISOString(),
      returnedAt: null
    };

    db.issues.push(newIssue);
    return res.status(201).json(newIssue);
  }

  return res.status(400).json({ error: 'Invalid issue type. Must be "part" or "kit"' });
});

/**
 * PATCH /api/issues/:id/return
 * Mark an issued item/kit as returned and restore stock to inventory
 */
router.patch('/issues/:id/return', (req, res) => {
  const issue = db.issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue record not found' });
  }

  if (issue.status === 'returned') {
    return res.status(400).json({ error: 'This issue has already been marked as returned' });
  }

  // Restore inventory stock for each item in the issue
  for (const line of issue.lines) {
    const part = db.parts.find((p) => p.id === line.partId);
    if (part) {
      part.available += line.qty;
    }
  }

  issue.status = 'returned';
  issue.returnedAt = new Date().toISOString();

  res.json(issue);
});

/**
 * GET /api/issues
 * List issues with "who has what" view and overdue filtering
 * Query: ?status=overdue or ?regNo=...
 */
router.get('/issues', (req, res) => {
  const { status, regNo } = req.query;
  const now = new Date();

  // Attach dynamic isOverdue calculation to each issue
  let results = db.issues.map((issue) => {
    const isOverdue =
      issue.status === 'issued' &&
      issue.dueDate &&
      new Date(issue.dueDate) < now;

    return {
      ...issue,
      isOverdue
    };
  });

  if (regNo) {
    results = results.filter((i) => i.regNo === regNo.trim().toUpperCase());
  }

  if (status === 'overdue') {
    results = results.filter((i) => i.isOverdue);
  }

  res.json(results);
});

export default router;
