// server/src/routes/issues.js
import express from 'express';
import { db, logEvent } from '../db.js';

const router = express.Router();

/**
 * POST /api/issues
 * Student submits checkout request
 * Body: { memberName, regNo, borrowingAt, dueDate, type: 'part'|'kit', kitId, partId, qty }
 */
router.post('/issues', (req, res) => {
  const { memberName, regNo, borrowingAt, dueDate, type, partId, qty, kitId } = req.body;

  if (!memberName || !memberName.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!regNo || !regNo.trim()) {
    return res.status(400).json({ error: 'Registration number is required' });
  }
  if (!dueDate) {
    return res.status(400).json({ error: 'Expected return date & time is required' });
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
    borrowingAt: borrowingAt || new Date().toISOString(),
    dueDate,
    status: 'pending',
    condition: 'good',
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
 * OC approves request with all-or-nothing check
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

  // Stock confirmed, decrement now
  for (const line of issue.lines) {
    const part = db.parts.find((p) => p.id === line.partId);
    part.available -= line.qty;
  }

  issue.status = 'issued';
  issue.issuedAt = new Date().toISOString();
  logEvent('REQUEST_APPROVED', 'oc', issue.id, { title: issue.title, regNo: issue.regNo });

  res.json(issue);
});

/**
 * POST /api/issues/:id/reject
 * OC rejects request
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
  logEvent('REQUEST_REJECTED', 'oc', issue.id, { title: issue.title, regNo: issue.regNo });

  res.json(issue);
});

/**
 * PATCH /api/issues/:id/return
 * Standard return (all parts good condition)
 */
router.patch('/issues/:id/return', (req, res) => {
  const issue = db.issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue record not found' });
  }

  if (issue.status === 'returned') {
    return res.status(400).json({ error: 'This issue is already marked returned' });
  }

  for (const line of issue.lines) {
    const part = db.parts.find((p) => p.id === line.partId);
    if (part) {
      part.available += line.qty;
    }
  }

  issue.status = 'returned';
  issue.condition = 'good';
  issue.returnedAt = new Date().toISOString();
  logEvent('RETURN_VERIFIED', 'oc', issue.id, { title: issue.title, regNo: issue.regNo });

  res.json(issue);
});

/**
 * POST /api/issues/:id/return-defective
 * Return a defective kit and immediately issue a fresh replacement kit to the participant!
 * Body: { defectiveNote, defectivePartId }
 */
router.post('/issues/:id/return-defective', (req, res) => {
  const { defectiveNote, defectivePartId } = req.body;
  const issue = db.issues.find((i) => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: 'Issue record not found' });
  }

  if (issue.status !== 'issued') {
    return res.status(400).json({ error: 'Only actively issued items can be processed for defective return' });
  }

  // 1. Mark original issue as returned with defective note
  issue.status = 'returned';
  issue.condition = 'defective';
  issue.defectiveNote = defectiveNote || 'Returned with defective components';
  issue.returnedAt = new Date().toISOString();

  // 2. Restock only non-defective parts; defective part reduces total lab count
  for (const line of issue.lines) {
    const part = db.parts.find((p) => p.id === line.partId);
    if (part) {
      if (defectivePartId && part.id === defectivePartId) {
        // Part is damaged/scrapped: reduces total inventory count
        if (part.total > 0) part.total -= 1;
      } else {
        // Non-defective parts get restored to available
        part.available += line.qty;
      }
    }
  }

  logEvent('RETURN_DEFECTIVE', 'oc', issue.id, {
    regNo: issue.regNo,
    note: issue.defectiveNote,
    defectivePartId
  });

  // 3. Immediately issue a fresh replacement kit to this participant (if it was a kit)
  let replacementIssue = null;
  if (issue.type === 'kit' && issue.kitId) {
    const kit = db.kits.find((k) => k.id === issue.kitId);
    if (kit) {
      // Check if replacement can be issued
      const canIssue = kit.items.every((item) => {
        const part = db.parts.find((p) => p.id === item.partId);
        return part && part.available >= item.qty;
      });

      if (canIssue) {
        // Decrement stock for replacement
        const replacementLines = [];
        for (const item of kit.items) {
          const part = db.parts.find((p) => p.id === item.partId);
          part.available -= item.qty;
          replacementLines.push({
            partId: part.id,
            partName: part.name,
            qty: item.qty
          });
        }

        const newCode = 'K-' + Math.floor(1000 + Math.random() * 9000);
        replacementIssue = {
          id: `issue-${Date.now()}-repl`,
          code: newCode,
          type: 'kit',
          kitId: kit.id,
          title: `${kit.name} (Replacement)`,
          lines: replacementLines,
          memberName: issue.memberName,
          regNo: issue.regNo,
          borrowingAt: new Date().toISOString(),
          dueDate: issue.dueDate,
          status: 'issued', // Immediately approved and issued
          condition: 'good',
          requestedAt: new Date().toISOString(),
          issuedAt: new Date().toISOString(),
          returnedAt: null,
          replacedIssueId: issue.id
        };

        db.issues.push(replacementIssue);
        logEvent('REPLACEMENT_ISSUED', 'oc', replacementIssue.id, {
          forIssueId: issue.id,
          code: newCode,
          regNo: issue.regNo
        });
      }
    }
  }

  res.json({
    message: 'Defective return processed successfully',
    oldIssue: issue,
    replacementIssue
  });
});

/**
 * GET /api/issues
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
