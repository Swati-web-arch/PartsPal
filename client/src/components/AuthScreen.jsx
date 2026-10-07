// client/src/components/AuthScreen.jsx
import React, { useState } from 'react';
import { loginUser } from '../api';

export default function AuthScreen({ onLoginSuccess }) {
  const [role, setRole] = useState('p'); // 'p' = Participant, 'oc' = OC Member
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !regNo.trim()) {
      setError('Please provide both your Email ID and Registration Number.');
      return;
    }

    // Validate VIT student email format
    const vitEmailRegex = /^[a-z]+\.[a-z]+\d{4}@vitstudent\.ac\.in$/i;
    if (!vitEmailRegex.test(email.trim())) {
      setError('Email must be in VIT format: xyz.abc2025@vitstudent.ac.in');
      return;
    }

    // Validate reg no format (e.g. 25BRS1234)
    const regNoRegex = /^\d{2}[A-Z]{3}\d{4}$/i;
    if (!regNoRegex.test(regNo.trim())) {
      setError('Registration number must be in format: 25BRS1234');
      return;
    }

    if (role === 'oc' && !passcode.trim()) {
      setError('Please provide the OC Member Passcode.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser({
        role,
        email,
        regNo,
        passcode
      });
      // Attach name locally if provided
      user.name = name.trim() || (role === 'oc' ? 'OC Member' : 'Participant');
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '460px',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🤖</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>PartsPal</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Robotics Club Inventory & Kit Checkout
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
            You are signing in as:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => { setRole('p'); setError(''); }}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: role === 'p' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: role === 'p' ? '#eff6ff' : '#f8fafc',
                color: role === 'p' ? '#1d4ed8' : '#64748b',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              🎓 Participant (P)
            </button>
            <button
              type="button"
              onClick={() => { setRole('oc'); setError(''); }}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: role === 'oc' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: role === 'oc' ? '#eff6ff' : '#f8fafc',
                color: role === 'oc' ? '#1d4ed8' : '#64748b',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              🛠️ OC Member (OC)
            </button>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. xyz abc"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email ID *</label>
            <input
              type="email"
              placeholder="e.g. xyz.abc2025@vitstudent.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Registration Number *</label>
            <input
              type="text"
              placeholder="e.g. 25BRS1234"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value.toUpperCase())}
              required
            />
          </div>

          {/* OC Member Passcode Field */}
          {role === 'oc' && (
            <div className="form-group">
              <label>OC Passcode * (Known only by OC Leads)</label>
              <input
                type="password"
                placeholder="Enter secret OC passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                Hint for demo: <code>labsecret123</code>
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : role === 'p' ? 'Enter Participant Portal' : 'Enter OC Lead Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
