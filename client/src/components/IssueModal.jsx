// client/src/components/IssueModal.jsx
import React, { useState } from 'react';

export default function IssueModal({ target, onClose, onSubmit }) {
  const [memberName, setMemberName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [pickupCode, setPickupCode] = useState(null);

  // Default due date to tomorrow at 5:00 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(17, 0, 0, 0);

  const [dueDate, setDueDate] = useState(tomorrow.toISOString().slice(0, 16));
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!memberName.trim() || !regNo.trim() || !dueDate) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        memberName,
        regNo,
        dueDate: new Date(dueDate).toISOString(),
        type: target.type
      };

      if (target.type === 'kit') {
        payload.kitId = target.item.id;
      } else {
        payload.partId = target.item.id;
        payload.qty = parseInt(qty, 10);
      }

      const result = await onSubmit(payload);
      setPickupCode(result.code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If request has been created, show the pickup code screen!
  if (pickupCode) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Request Submitted!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Show this pickup code to the lab assistant to receive your items:
          </p>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '2px',
              background: '#eff6ff',
              color: '#2563eb',
              padding: '1rem',
              borderRadius: '8px',
              border: '2px dashed #93c5fd',
              marginBottom: '1.5rem'
            }}
          >
            {pickupCode}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
          Request {target.type === 'kit' ? 'Kit' : 'Part'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Requesting <strong>{target.item.name}</strong> from the lab.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Student Name *</label>
            <input
              type="text"
              placeholder="e.g. Alex Rivera"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Registration Number *</label>
            <input
              type="text"
              placeholder="e.g. 22BCE1234"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Expected Return Date & Time *</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          {target.type === 'part' && (
            <div className="form-group">
              <label>Quantity * (Available: {target.item.available})</label>
              <input
                type="number"
                min="1"
                max={target.item.available}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
