// client/src/components/IssueModal.jsx
import React, { useState } from 'react';

export default function IssueModal({ target, onClose, onSubmit }) {
  const [memberName, setMemberName] = useState('');
  const [regNo, setRegNo] = useState('');
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

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
          Issue {target.type === 'kit' ? 'Kit' : 'Part'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Assigning <strong>{target.item.name}</strong> to a member.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Member Name *</label>
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
            <label>Due Date & Time *</label>
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
              {loading ? 'Processing...' : 'Confirm Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
