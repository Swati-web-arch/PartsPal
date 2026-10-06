// client/src/components/KitsView.jsx
import React from 'react';

export default function KitsView({ kits, onOpenIssueModal }) {
  return (
    <div>
      <div style={{ margin: '1rem 0' }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Bundled project kits with automatic all-or-nothing stock validation.
        </p>
      </div>

      <div className="grid">
        {kits.map((kit) => (
          <div key={kit.id} className="card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{kit.name}</h3>
                <span className={`badge ${kit.canIssueCount > 0 ? 'badge-success' : 'badge-low'}`}>
                  {kit.canIssueCount > 0 ? `Can issue: ${kit.canIssueCount}` : 'Out of Stock'}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.4rem', color: '#475569' }}>
                  Kit Contents:
                </strong>
                <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                  {kit.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.2rem' }}>
                      {item.qty}x {item.partName}{' '}
                      <span style={{ color: item.available >= item.qty ? '#16a34a' : '#dc2626' }}>
                        ({item.available} in stock)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={kit.canIssueCount === 0}
                onClick={() => onOpenIssueModal({ type: 'kit', item: kit })}
              >
                {kit.canIssueCount > 0 ? 'Issue Kit' : 'Kit Incomplete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
