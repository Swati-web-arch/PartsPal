// client/src/components/WhoHasWhatView.jsx
import React from 'react';

export default function WhoHasWhatView({ issues, onMarkReturn, loadingReturnId }) {
  const activeIssues = issues.filter((i) => i.status === 'issued');

  return (
    <div>
      <div style={{ margin: '1rem 0' }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Currently active checkouts. Items past their due date are highlighted in red.
        </p>
      </div>

      {activeIssues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          🎉 All items are currently returned to the lab!
        </div>
      ) : (
        <div className="grid">
          {activeIssues.map((issue) => (
            <div
              key={issue.id}
              className={`card ${issue.isOverdue ? 'overdue-card' : ''}`}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{issue.title}</h3>
                  {issue.isOverdue ? (
                    <span className="badge badge-overdue">OVERDUE</span>
                  ) : (
                    <span className="badge badge-warning">Active</span>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                  <div>
                    <strong>Member:</strong> {issue.memberName} ({issue.regNo})
                  </div>
                  <div>
                    <strong>Issued At:</strong> {new Date(issue.issuedAt).toLocaleString()}
                  </div>
                  <div style={{ color: issue.isOverdue ? '#dc2626' : 'inherit', fontWeight: issue.isOverdue ? 600 : 'normal' }}>
                    <strong>Due Date:</strong> {new Date(issue.dueDate).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: issue.isOverdue ? '#fee2e2' : '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <strong>Items:</strong>
                  <ul style={{ paddingLeft: '1.2rem', margin: '0.2rem 0 0 0' }}>
                    {issue.lines.map((l, idx) => (
                      <li key={idx}>
                        {l.qty}x {l.partName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <button
                  className="btn btn-success"
                  style={{ width: '100%' }}
                  disabled={loadingReturnId === issue.id}
                  onClick={() => onMarkReturn(issue.id)}
                >
                  {loadingReturnId === issue.id ? 'Returning...' : 'Mark Returned'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
