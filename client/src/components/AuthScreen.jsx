// client/src/components/AuthScreen.jsx
import React, { useState } from 'react';
import { loginUser } from '../api';
import robotMascot from '../assets/robot-mascot.svg';
import clubLogo from '../assets/club-logo.png';

export default function AuthScreen({ onLoginSuccess }) {
  const [role, setRole] = useState('p'); // 'p' = Participant, 'oc' = OC Member
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="auth-bg-wrapper">
      {/* Top Left Club Logo */}
      <div className="auth-club-logo">
        <div className="club-logo-wrapper">
          <img
            src={clubLogo}
            alt="Robotics Club VITC Logo"
            className="club-logo-img"
          />
        </div>
        <div className="logo-text">
          <h3>Robotics Club</h3>
          <span>VITC</span>
        </div>
      </div>

      {/* Glowing Brand Title */}
      <div className="auth-brand-heading">
        <h1 className="auth-brand-title">PartsPal</h1>
        <p className="auth-brand-sub">Robotics Club Inventory Management</p>
      </div>

      {/* Glass Card + Mascot Wrapper */}
      <div className="auth-card-container">
        {/* Waving Mascot Robot */}
        <img
          src={robotMascot}
          alt="PartsPal Robot Assistant"
          className="auth-robot-mascot"
        />

        <div className="auth-glass-card">
          <h2
            style={{
              textAlign: 'center',
              color: '#f8fafc',
              fontSize: '1.45rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
              letterSpacing: '0.5px'
            }}
          >
            Login
          </h2>

          {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '0.9rem' }}>
              <label style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                Registration Number
              </label>
              <input
                type="text"
                placeholder="e.g. 25BRS1234"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                className="auth-dark-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.9rem' }}>
              <label style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                Email ID (VIT Student)
              </label>
              <input
                type="email"
                placeholder="e.g. xyz.abc2025@vitstudent.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-dark-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.9rem' }}>
              <label style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. xyz abc"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-dark-input"
                required
              />
            </div>

            {/* OC Passcode Field (for OC role) */}
            {role === 'oc' && (
              <div className="form-group" style={{ marginBottom: '0.9rem', position: 'relative' }}>
                <label style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 600 }}>
                  OC Passcode *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter OC Lead passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="auth-dark-input"
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '1.1rem'
                    }}
                    title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-amber-glow"
              style={{ marginTop: '0.6rem' }}
              disabled={loading}
            >
              {loading
                ? 'Authenticating...'
                : role === 'p'
                ? 'Login'
                : 'Login as OC Lead'}
            </button>
          </form>

          {/* Dual Segmented Role Switcher at Bottom */}
          <div className="auth-segmented-tabs">
            <button
              type="button"
              className={`auth-segmented-btn ${role === 'p' ? 'active' : ''}`}
              onClick={() => {
                setRole('p');
                setError('');
              }}
            >
              Participant Portal
            </button>
            <button
              type="button"
              className={`auth-segmented-btn ${role === 'oc' ? 'active' : ''}`}
              onClick={() => {
                setRole('oc');
                setError('');
              }}
            >
              OC Lead Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

