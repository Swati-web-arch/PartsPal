// client/src/components/AddPartModal.jsx
import React, { useState } from 'react';

export default function AddPartModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sensors');
  const [total, setTotal] = useState(5);
  const [threshold, setThreshold] = useState(2);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Sensors', 'Microcontrollers', 'Motors', 'Drivers', 'Power', 'Hardware'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Part name is required');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        name,
        category,
        total: parseInt(total, 10),
        lowStockThreshold: parseInt(threshold, 10)
      });
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
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Add New Part</h2>
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Part Name *</label>
            <input
              type="text"
              placeholder="e.g. Ultrasonic Sensor HC-SR04"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Total Inventory Count *</label>
            <input
              type="number"
              min="1"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Low Stock Warning Threshold</label>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
