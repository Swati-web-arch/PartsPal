// server/src/routes/auth.js
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { role: 'p' | 'oc', email, regNo, passcode }
 */
router.post('/login', (req, res) => {
  const { role, email, regNo, passcode } = req.body;

  if (!role || (role !== 'p' && role !== 'oc')) {
    return res.status(400).json({ error: 'Please specify role as Participant (p) or OC Member (oc)' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email ID is required' });
  }

  if (!regNo || !regNo.trim()) {
    return res.status(400).json({ error: 'Registration number is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRegNo = regNo.trim().toUpperCase();

  // If signing in as OC Member, check passcode
  if (role === 'oc') {
    const requiredPasscode = process.env.ASSISTANT_PASSWORD ;
    if (!passcode || passcode.trim() !== requiredPasscode) {
      return res.status(401).json({ error: 'Invalid OC Member Passcode. Only known by OC leads.' });
    }

    return res.json({
      role: 'oc',
      email: cleanEmail,
      regNo: cleanRegNo,
      roleName: 'OC Member'
    });
  }

  // Participant login
  return res.json({
    role: 'p',
    email: cleanEmail,
    regNo: cleanRegNo,
    roleName: 'Participant'
  });
});

export default router;
