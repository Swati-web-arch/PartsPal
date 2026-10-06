// client/src/components/PendingQueueView.jsx
import React, { useState } from 'react';

export default function PendingQueueView({ issues, onApprove, onReject }) {
  const pendingRequests = issues.filter((i) => i.status === 'pending');
  const [processingId, setProcessingId] = useState(null);

  const handleApprove = async (id) => {
    setProcessingId(id);
    await onApprove(id);
    setProcessingId(null);
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    await onReject(id);
    setProcessingId(null);
  };

  return (
    <div>
      <div style={{ margin: '1rem 0' }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Student checkout requests awaiting assistant approval. Stock is decremented only upon approval.
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          ✨ No pending requests in the queue.
        </div>
      ) : (
        <div className="grid">
          {pendingRequests.map((req) => (
            <div key={req.id} className="card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{req.title}</h3>
                  <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#92400e' }}>
                    {req.code}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                  <div>
                    <strong>Student:</strong> {req.memberName} (<code>{req.regNo}</code>)
                  </div>
                  <div>
                    <strong>Requested:</strong> {new Date(req.requestedAt).toLocaleTimeString()}
                  </div>
                  <div>
                    <strong>Due Date:</strong> {new Date(req.dueDate).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <strong>Requested Items:</strong>
                  <ul style={{ paddingLeft: '1.2rem', margin: '0.2rem 0 0 0' }}>
                    {req.lines.map((l, idx) => (
                      <li key={idx}>
                        {l.qty}x {l.partName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, color: '#dc2626' }}
                  disabled={processingId === req.id}
                  onClick={() => handleReject(req.id)}
                >
                  Reject
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                  disabled={processingId === req.id}
                  onClick={() => handleApprove(req.id)}
                >
                  {processingId === req.id ? 'Approving...' : 'Approve & Issue'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
