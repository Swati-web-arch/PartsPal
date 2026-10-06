// server/src/routes/issues.js
import express from 'express';
import { db, logEvent } from '../db.js';

const router = express.Router();

/**
 * POST /api/issues
 * Student submits a request for a kit or a part.
 * Stock DOES NOT decrement yet! Status starts as 'pending'.
 * Generates a pickup code (e.g. K-4821).
 */
router.post('/issues', (req, res) => {
  const { memberName, regNo, dueDate, type, partId, qty, kitId } = req.body;

  if (!memberName || !memberName.trim()) {
    return res.status(400).json({ error: 'Student name is required' });
  }
  if (!regNo || !regNo.trim()) {
    return res.status(400).json({ error: 'Registration number is required' });
  }
  if (!dueDate) {
    return res.status(400).json({ error: 'Expected return date/time is required' });
  }

  const cleanRegNo = regNo.trim().toUpperCase();
  const cleanMemberName = memberName.trim();
  const code = (type === 'kit' ? 'K-' : 'P-') + Math.floor(1000 + Math.random() * 9000);

  let lines = [];
  let title = '';

  if (type === 'kit') {
    const kit = db.kits.find((k) => k.id === kitId);
    if (!kit) {
      return res.status(404).json({ error: 'Kit not found' });
    }
    title = kit.name;
    lines = kit.items.map((item) => {
      const part = db.parts.find((p) => p.id === item.partId);
      return {
        partId: item.partId,
        partName: part ? part.name : 'Unknown Part',
        qty: item.qty
      };
    });
  } else if (type === 'part') {
    const issueQty = parseInt(qty, 10);
    if (isNaN(issueQty) || issueQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }
    const part = db.parts.find((p) => p.id === partId);
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    title = part.name;
    lines = [
      {
        partId: part.id,
        partName: part.name,
        qty: issueQty
      }
    ];
  } else {
    return res.status(400).json({ error: 'Invalid issue type. Must be "part" or "kit"' });
  }

  const newIssue = {
    id: `issue-${Date.now()}`,
    code,
    type,
    kitId: type === 'kit' ? kitId : null,
    partId: type === 'part' ? partId : null,
    title,
    lines,
    memberName: cleanMemberName,
    regNo: cleanRegNo,
    dueDate,
    status: 'pending', // Awaiting assistant approval
    requestedAt: new Date().toISOString(),
    issuedAt: null,
    returnedAt: null
  };

  db.issues.push(newIssue);
  logEvent('REQUEST_SUBMITTED', `student:${cleanRegNo}`, newIssue.id, { title, code });

  res.status(201).json(newIssue);
});

/**
 * POST /api/issues/:id/approve
 * Assistant approves a pending request.
 * Stock is decremented HERE with all-or-nothing verification!
 */
router.post('/issues/:id/approve', (req, res) => {
  const issue = db.issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (issue.status !== 'pending') {
    return res.status(400).json({ error: `Cannot approve request with status "${issue.status}"` });
  }

  // ALL-OR-NOTHING STOCK CHECK
  const shortParts = [];
  for (const line of issue.lines) {
    const part = db.parts.find((p) => p.id === line.partId);
    if (!part || part.available < line.qty) {
      shortParts.push({
        partName: part ? part.name : 'Unknown Part',
        required: line.qty,
        available: part ? part.available : 0
      });
    }
  }

  if (shortParts.length > 0) {
    const errorMsg = shortParts
      .map((sp) => `${sp.partName} (Needs: ${sp.required}, Available: ${sp.available})`)
      .join(', ');
    return res.status(400).json({
      error: `Cannot issue items. Insufficient stock for: ${errorMsg}`,
      shortParts
    });
  }

  // Stock available! Decrement stock now
  for (const line of issue.lines) {
    const part = db.parts.find((p) => p.id === line.partId);
    part.available -= line.qty;
  }

  issue.status = 'issued';
  issue.issuedAt = new Date().toISOString();
  logEvent('REQUEST_APPROVED', 'assistant', issue.id, { title: issue.title, regNo: issue.regNo });

  res.json(issue);
});

/**
 * POST /api/issues/:id/reject
 * Assistant rejects a pending request.
 */
router.post('/issues/:id/reject', (req, res) => {
  const issue = db.issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (issue.status !== 'pending') {
    return res.status(400).json({ error: `Cannot reject request with status "${issue.status}"` });
  }

  issue.status = 'rejected';
  logEvent('REQUEST_REJECTED', 'assistant', issue.id, { title: issue.title, regNo: issue.regNo });

  res.json(issue);
});

/**
 * PATCH /api/issues/:id/return
 * Assistant verifies return and restores stock to inventory
 */
router.patch('/issues/:id/return', (req, res) => {
  const issue = db.issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue record not found' });
  }

  if (issue.status === 'returned') {
    return res.status(400).json({ error: 'This issue has already been marked as returned' });
  }

  if (issue.status !== 'issued') {
    return res.status(400).json({ error: `Cannot return an item with status "${issue.status}"` });
  }

  // Restore inventory stock
  for (const line of issue.lines) {
    const part = db.parts.find((p) => p.id === line.partId);
    if (part) {
      part.available += line.qty;
    }
  }

  issue.status = 'returned';
  issue.returnedAt = new Date().toISOString();
  logEvent('RETURN_VERIFIED', 'assistant', issue.id, { title: issue.title, regNo: issue.regNo });

  res.json(issue);
});

/**
 * GET /api/issues
 * List issues with overdue status calculation
 */
router.get('/issues', (req, res) => {
  const { status, regNo } = req.query;
  const now = new Date();

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

  if (status) {
    if (status === 'overdue') {
      results = results.filter((i) => i.isOverdue);
    } else {
      results = results.filter((i) => i.status === status);
    }
  }

  res.json(results);
});

export default router;
