// client/src/components/InventoryView.jsx
import React, { useState } from 'react';

export default function InventoryView({ parts, search, setSearch, category, setCategory, onOpenIssueModal, onOpenAddPartModal }) {
  // Extract unique categories for filter
  const categories = ['All', ...new Set(parts.map((p) => p.category))];

  return (
    <div>
      {/* Controls Bar: Search, Category Filter, and Add Part */}
      <div className="controls-bar">
        <input
          type="text"
          placeholder="Search parts (e.g. Arduino, Sensor)..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={onOpenAddPartModal}>
          + New Part
        </button>
      </div>

      {/* Grid of Parts */}
      {parts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          No parts found matching criteria.
        </div>
      ) : (
        <div className="grid">
          {parts.map((part) => (
            <div key={part.id} className="card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{part.name}</h3>
                  <span className="badge badge-warning" style={{ background: '#f1f5f9', color: '#475569' }}>
                    {part.category}
                  </span>
                </div>

                <div style={{ margin: '0.75rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    <span>Available / Total:</span>
                    <strong>
                      {part.available} / {part.total}
                    </strong>
                  </div>

                  {/* Stretch Goal: Low-stock warning badge */}
                  {part.isLowStock && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className="badge badge-low">
                        ⚠️ Low Stock (≤ {part.lowStockThreshold})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={part.available === 0}
                  onClick={() => onOpenIssueModal({ type: 'part', item: part })}
                >
                  {part.available > 0 ? 'Issue Part' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
