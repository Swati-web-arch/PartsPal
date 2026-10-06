// client/src/components/ParticipantPortal.jsx
import React, { useState } from 'react';
import QRCodeModal from './QRCodeModal';
import { getDueStatus } from '../utils/time';

export default function ParticipantPortal({
  user,
  parts,
  kits,
  issues,
  onLogout,
  onRequestSubmit
}) {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'my-requests'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [requestTarget, setRequestTarget] = useState(null); // { type: 'kit'|'part', item: {...} }

  // Modal form states
  const [borrowingAt, setBorrowingAt] = useState(new Date().toISOString().slice(0, 16));
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('17:00');
  const [qty, setQty] = useState(1);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);

  // Standalone QR code viewer
  const [qrModalData, setQrModalData] = useState(null);

  // Filter student's own requests
  const myRequests = issues.filter(
    (i) => i.regNo.toUpperCase() === user.regNo.toUpperCase()
  );

  const categories = ['All', 'Kits', ...new Set(parts.map((p) => p.category))];

  // Helper presets for quick return time
  const applyPreset = (hoursToAdd, isTomorrow9AM = false) => {
    const target = new Date();
    if (isTomorrow9AM) {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else {
      target.setHours(target.getHours() + hoursToAdd);
    }
    setReturnDate(target.toISOString().slice(0, 10));
    setReturnTime(target.toTimeString().slice(0, 5));
  };

  const handleOpenModal = (target) => {
    setRequestTarget(target);
    setQty(1);
    setModalError('');
    setGeneratedCode(null);
    setBorrowingAt(new Date().toISOString().slice(0, 16));
    applyPreset(4); // default +4 hours
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!returnDate || !returnTime) {
      setModalError('Please specify expected return date and time.');
      return;
    }

    setModalLoading(true);
    try {
      const combinedDueDate = new Date(`${returnDate}T${returnTime}:00`).toISOString();
      const payload = {
        memberName: user.name,
        regNo: user.regNo,
        borrowingAt: new Date(borrowingAt).toISOString(),
        dueDate: combinedDueDate,
        type: requestTarget.type
      };

      if (requestTarget.type === 'kit') {
        payload.kitId = requestTarget.item.id;
      } else {
        payload.partId = requestTarget.item.id;
        payload.qty = parseInt(qty, 10);
      }

      const res = await onRequestSubmit(payload);
      setGeneratedCode(res.code);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredParts = parts.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Top Navbar */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <span>🤖</span> PartsPal &mdash; Participant Portal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#475569', textAlign: 'right' }}>
              <strong>{user.name}</strong> (<code>{user.regNo}</code>)
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
            </div>
            <button className="btn btn-secondary" onClick={onLogout} style={{ fontSize: '0.8rem' }}>
              Switch / Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container" style={{ paddingBottom: 0 }}>
        <div className="nav-tabs" style={{ marginTop: '0.5rem' }}>
          <button
            className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            📦 Available Kits & Parts
          </button>
          <button
            className={`tab-btn ${activeTab === 'my-requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-requests')}
          >
            📋 My Requests & Items ({myRequests.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container">
        {activeTab === 'catalog' && (
          <div>
            {/* Filter Bar */}
            <div className="controls-bar">
              <input
                type="text"
                placeholder="Search components or kits..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Kits Section */}
            {(selectedCategory === 'All' || selectedCategory === 'Kits') && (
              <div style={{ marginTop: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#1e293b' }}>
                  🚀 Complete Robotics Kits
                </h2>
                <div className="grid">
                  {kits.map((kit) => (
                    <div key={kit.id} className="card">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{kit.name}</h3>
                          <span className={`badge ${kit.canIssueCount > 0 ? 'badge-success' : 'badge-low'}`}>
                            Remaining: {kit.canIssueCount}
                          </span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#475569' }}>
                            Kit Contains:
                          </strong>
                          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                            {kit.items.map((it, idx) => (
                              <li key={idx}>
                                {it.qty}x {it.partName}{' '}
                                <span style={{ color: it.available >= it.qty ? '#16a34a' : '#dc2626', fontSize: '0.8rem' }}>
                                  ({it.available} in stock)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.55rem' }}
                          title="View QR Label"
                          onClick={() => setQrModalData({ title: kit.name, value: `KIT:${kit.id}:${kit.name}`, subtitle: 'Kit Shelf Label' })}
                        >
                          📱 QR
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                          disabled={kit.canIssueCount === 0}
                          onClick={() => handleOpenModal({ type: 'kit', item: kit })}
                        >
                          {kit.canIssueCount > 0 ? 'Request This Kit' : 'Kit Out of Stock'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Parts & Sensors Section */}
            {selectedCategory !== 'Kits' && (
              <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#1e293b' }}>
                  ⚙️ Individual Sensors & Components
                </h2>
                <div className="grid">
                  {filteredParts.map((part) => (
                    <div key={part.id} className="card">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{part.name}</h3>
                          <span className="badge badge-warning" style={{ background: '#f1f5f9', color: '#475569' }}>
                            {part.category}
                          </span>
                        </div>

                        <div style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Available in Lab:</span>
                            <strong>{part.available} / {part.total}</strong>
                          </div>
                          {part.isLowStock && (
                            <div style={{ marginTop: '0.4rem' }}>
                              <span className="badge badge-low">Low Stock</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem' }}>
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%' }}
                          disabled={part.available === 0}
                          onClick={() => handleOpenModal({ type: 'part', item: part })}
                        >
                          {part.available > 0 ? 'Request Part' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'my-requests' && (
          <div style={{ marginTop: '1rem' }}>
            {myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                You have not made any checkout requests yet.
              </div>
            ) : (
              <div className="grid">
                {myRequests.map((req) => {
                  const dueInfo = getDueStatus(req.dueDate, req.returnedAt);
                  return (
                    <div key={req.id} className={`card ${dueInfo.isOverdue && req.status === 'issued' ? 'overdue-card' : ''}`}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{req.title}</h3>
                          <span
                            className="badge"
                            style={{
                              background: dueInfo.color,
                              color: 'white'
                            }}
                          >
                            {req.status === 'issued' ? dueInfo.label : req.status.toUpperCase()}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong>Pickup Code:</strong>
                            <code style={{ color: '#2563eb', fontWeight: 700, fontSize: '1rem' }}>{req.code}</code>
                            <button
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                              title="Show QR Code"
                              onClick={() => setQrModalData({ title: `Pickup Code: ${req.code}`, value: req.code, subtitle: `Show this to OC Desk for ${req.title}` })}
                            >
                              📱 QR
                            </button>
                          </div>
                          <div><strong>Borrowing At:</strong> {new Date(req.borrowingAt).toLocaleString()}</div>
                          <div><strong>Expected Return:</strong> {new Date(req.dueDate).toLocaleString()}</div>
                          {req.status === 'pending' && (
                            <div style={{ color: '#b45309', fontWeight: 500, marginTop: '0.25rem' }}>
                              ⏳ Awaiting OC desk approval
                            </div>
                          )}
                          {req.replacedIssueId && (
                            <div style={{ color: '#16a34a', fontWeight: 500, marginTop: '0.25rem' }}>
                              🔄 Issued as replacement for defective kit
                            </div>
                          )}
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <strong>Items:</strong>
                          <ul style={{ paddingLeft: '1.2rem', margin: '0.2rem 0 0 0' }}>
                            {req.lines.map((l, idx) => (
                              <li key={idx}>{l.qty}x {l.partName}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Request Modal with Quick Presets */}
      {requestTarget && (
        <div className="modal-overlay" onClick={() => setRequestTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {generatedCode ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Request Sent to OC!</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Show this pickup code or QR code at the lab desk:
                </p>
                <div
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    letterSpacing: '3px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '2px dashed #93c5fd',
                    marginBottom: '1rem'
                  }}
                >
                  {generatedCode}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => {
                      setQrModalData({
                        title: `Pickup Code: ${generatedCode}`,
                        value: generatedCode,
                        subtitle: `Student ${user.name} (${user.regNo}) - ${requestTarget.item.name}`
                      });
                    }}
                  >
                    📱 Open Scannable QR Code
                  </button>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setRequestTarget(null);
                    setActiveTab('my-requests');
                  }}
                >
                  View My Requests
                </button>
              </div>
            ) : (
              <div>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                  Request {requestTarget.type === 'kit' ? 'Kit' : 'Part'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Requesting <strong>{requestTarget.item.name}</strong> from the lab.
                </p>

                {modalError && <div className="alert-error">{modalError}</div>}

                <form onSubmit={handleFormSubmit}>
                  <div className="form-group">
                    <label>Borrowing At (Date & Time) *</label>
                    <input
                      type="datetime-local"
                      value={borrowingAt}
                      onChange={(e) => setBorrowingAt(e.target.value)}
                      required
                    />
                  </div>

                  {/* Quick Presets for Return */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                      Quick Return Presets:
                    </label>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => applyPreset(2)}
                      >
                        +2 Hours
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => applyPreset(4)}
                      >
                        +4 Hours
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => applyPreset(0, true)}
                      >
                        Tomorrow 9:00 AM
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group">
                      <label>Expected Return Date *</label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Expected Return Time *</label>
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {requestTarget.type === 'part' && (
                    <div className="form-group">
                      <label>Quantity * (Available: {requestTarget.item.available})</label>
                      <input
                        type="number"
                        min="1"
                        max={requestTarget.item.available}
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setRequestTarget(null)}
                      disabled={modalLoading}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                      {modalLoading ? 'Sending...' : 'Confirm Request'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone QR Code Modal */}
      {qrModalData && (
        <QRCodeModal
          title={qrModalData.title}
          value={qrModalData.value}
          subtitle={qrModalData.subtitle}
          onClose={() => setQrModalData(null)}
        />
      )}
    </div>
  );
}
