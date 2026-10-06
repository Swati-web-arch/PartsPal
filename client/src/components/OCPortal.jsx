// client/src/components/OCPortal.jsx
import React, { useState } from 'react';

export default function OCPortal({
  user,
  parts,
  kits,
  issues,
  onLogout,
  onApprove,
  onReject,
  onMarkReturn,
  onMarkDefectiveReturn,
  onUpdateKit,
  onCreateKit,
  onAddPart,
  onUpdatePartStock
}) {
  const [activeTab, setActiveTab] = useState('requests'); 
  // 'requests' | 'who-has-what' | 'kit-editor' | 'history'

  const [searchRegNo, setSearchRegNo] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Defective modal state
  const [defectiveModalTarget, setDefectiveModalTarget] = useState(null);
  const [defectiveNote, setDefectiveNote] = useState('');
  const [defectivePartId, setDefectivePartId] = useState('');
  const [defectiveLoading, setDefectiveLoading] = useState(false);

  // Edit existing kit state
  const [editingKit, setEditingKit] = useState(null);
  const [kitItems, setKitItems] = useState([]);
  const [selectedAddPartId, setSelectedAddPartId] = useState('');
  const [selectedAddQty, setSelectedAddQty] = useState(1);

  // Create new kit state
  const [showCreateKitModal, setShowCreateKitModal] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  const [newKitItems, setNewKitItems] = useState([]);
  const [createKitSelectedPartId, setCreateKitSelectedPartId] = useState('');
  const [createKitSelectedQty, setCreateKitSelectedQty] = useState(1);
  const [createKitError, setCreateKitError] = useState('');

  // Inline part creation within Kit creation
  const [inlineCreatePart, setInlineCreatePart] = useState(false);
  const [inlinePartName, setInlinePartName] = useState('');
  const [inlinePartCategory, setInlinePartCategory] = useState('Drivers');
  const [inlinePartTotal, setInlinePartTotal] = useState(10);

  // Add new part modal state
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCategory, setNewPartCategory] = useState('Sensors');
  const [newPartTotal, setNewPartTotal] = useState(10);
  const [newPartThreshold, setNewPartThreshold] = useState(2);

  // Edit part stock state
  const [editingPartStock, setEditingPartStock] = useState(null);
  const [editTotalCount, setEditTotalCount] = useState(0);

  // Counts
  const pendingRequests = issues.filter((i) => i.status === 'pending');
  const activeIssues = issues.filter((i) => i.status === 'issued');
  const overdueIssues = issues.filter((i) => i.status === 'issued' && i.isOverdue);

  // Open Defective Modal
  const handleOpenDefectiveModal = (issue) => {
    setDefectiveModalTarget(issue);
    setDefectiveNote('Returned with damaged/defective parts');
    setDefectivePartId(issue.lines[0]?.partId || '');
  };

  const handleConfirmDefective = async (e) => {
    e.preventDefault();
    setDefectiveLoading(true);
    try {
      await onMarkDefectiveReturn(defectiveModalTarget.id, {
        defectiveNote,
        defectivePartId
      });
      setDefectiveModalTarget(null);
    } finally {
      setDefectiveLoading(false);
    }
  };

  // Open Kit Editor
  const handleOpenKitEditor = (kit) => {
    setEditingKit(kit);
    setKitItems([...kit.items]);
    setSelectedAddPartId(parts[0]?.id || '');
    setSelectedAddQty(1);
  };

  const handleAddPartToKit = () => {
    if (!selectedAddPartId) return;
    const existingIndex = kitItems.findIndex((it) => it.partId === selectedAddPartId);
    const partObj = parts.find((p) => p.id === selectedAddPartId);

    if (existingIndex > -1) {
      const updated = [...kitItems];
      updated[existingIndex].qty += parseInt(selectedAddQty, 10);
      setKitItems(updated);
    } else {
      setKitItems([
        ...kitItems,
        {
          partId: selectedAddPartId,
          partName: partObj ? partObj.name : 'Unknown Part',
          qty: parseInt(selectedAddQty, 10),
          available: partObj ? partObj.available : 0
        }
      ]);
    }
  };

  const handleRemovePartFromKit = (partId) => {
    setKitItems(kitItems.filter((it) => it.partId !== partId));
  };

  const handleSaveKit = async () => {
    const payloadItems = kitItems.map((it) => ({
      partId: it.partId,
      qty: it.qty
    }));
    await onUpdateKit(editingKit.id, { items: payloadItems });
    setEditingKit(null);
  };

  // Create Kit Handlers
  const handleOpenCreateKit = () => {
    setShowCreateKitModal(true);
    setNewKitName('');
    setNewKitItems([]);
    setCreateKitError('');
    setCreateKitSelectedPartId(parts[0]?.id || '');
    setCreateKitSelectedQty(1);
    setInlineCreatePart(false);
  };

  // Add existing part to new kit
  const handleAddItemToNewKit = () => {
    if (!createKitSelectedPartId) return;
    const partObj = parts.find((p) => p.id === createKitSelectedPartId);
    const existingIndex = newKitItems.findIndex((it) => it.partId === createKitSelectedPartId);

    if (existingIndex > -1) {
      const updated = [...newKitItems];
      updated[existingIndex].qty += parseInt(createKitSelectedQty, 10);
      setNewKitItems(updated);
    } else {
      setNewKitItems([
        ...newKitItems,
        {
          partId: createKitSelectedPartId,
          partName: partObj ? partObj.name : 'Unknown Part',
          qty: parseInt(createKitSelectedQty, 10),
          available: partObj ? partObj.available : 0
        }
      ]);
    }
  };

  // Add Brand New Part On The Fly to New Kit
  const handleAddInlinePartToNewKit = async () => {
    if (!inlinePartName.trim()) {
      setCreateKitError('Please provide a name for the new part.');
      return;
    }

    try {
      // 1. Create part in inventory
      const createdPart = await onAddPart({
        name: inlinePartName.trim(),
        category: inlinePartCategory,
        total: parseInt(inlinePartTotal, 10),
        lowStockThreshold: 2
      });

      // 2. Add to kit list
      setNewKitItems([
        ...newKitItems,
        {
          partId: createdPart.id,
          partName: createdPart.name,
          qty: parseInt(createKitSelectedQty, 10),
          available: createdPart.available
        }
      ]);

      // Reset inline form
      setInlinePartName('');
      setInlineCreatePart(false);
      setCreateKitSelectedPartId(createdPart.id);
    } catch (err) {
      setCreateKitError(err.message);
    }
  };

  const handleRemoveItemFromNewKit = (partId) => {
    setNewKitItems(newKitItems.filter((it) => it.partId !== partId));
  };

  const handleSaveNewKit = async (e) => {
    e.preventDefault();
    setCreateKitError('');

    if (!newKitName.trim()) {
      setCreateKitError('Please provide a name for the new kit.');
      return;
    }

    if (newKitItems.length === 0) {
      setCreateKitError('Please add at least one component to the kit.');
      return;
    }

    try {
      await onCreateKit({
        name: newKitName.trim(),
        items: newKitItems.map((it) => ({ partId: it.partId, qty: it.qty }))
      });
      setShowCreateKitModal(false);
    } catch (err) {
      setCreateKitError(err.message);
    }
  };

  // Add Part Handlers
  const handleSaveNewPart = async (e) => {
    e.preventDefault();
    if (!newPartName.trim()) return;
    await onAddPart({
      name: newPartName.trim(),
      category: newPartCategory,
      total: parseInt(newPartTotal, 10),
      lowStockThreshold: parseInt(newPartThreshold, 10)
    });
    setShowAddPartModal(false);
    setNewPartName('');
  };

  // Update Part Stock Handler
  const handleSavePartStock = async (e) => {
    e.preventDefault();
    if (!editingPartStock) return;
    await onUpdatePartStock(editingPartStock.id, {
      total: parseInt(editTotalCount, 10)
    });
    setEditingPartStock(null);
  };

  // History filtering
  const filteredHistory = issues.filter((i) => {
    if (!searchRegNo.trim()) return true;
    return i.regNo.toLowerCase().includes(searchRegNo.trim().toLowerCase());
  });

  return (
    <div>
      {/* Top Header */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <span>🛠️</span> PartsPal &mdash; OC Lead Portal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#475569', textAlign: 'right' }}>
              <strong>{user.name}</strong> (OC Lead)
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
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            📥 Pending Requests ({pendingRequests.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'who-has-what' ? 'active' : ''}`}
            onClick={() => setActiveTab('who-has-what')}
          >
            📋 Who Has What ({activeIssues.length})
            {overdueIssues.length > 0 && (
              <span
                style={{
                  marginLeft: '0.4rem',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.75rem'
                }}
              >
                {overdueIssues.length} overdue
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'kit-editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('kit-editor')}
          >
            🧰 Customize Kits & Parts ({kits.length} Kits, {parts.length} Parts)
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Member History
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container">
        {/* 1. Requests Queue */}
        {activeTab === 'requests' && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Pending requests submitted by participants. Approve will decrement stock atomically with all-or-nothing validation.
            </p>

            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                ✨ No pending checkout requests.
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

                      <div style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                        <div><strong>Participant:</strong> {req.memberName} (<code>{req.regNo}</code>)</div>
                        <div><strong>Borrowing At:</strong> {new Date(req.borrowingAt).toLocaleString()}</div>
                        <div><strong>Due Date:</strong> {new Date(req.dueDate).toLocaleString()}</div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        <strong>Requested Items:</strong>
                        <ul style={{ paddingLeft: '1.2rem', margin: '0.2rem 0 0 0' }}>
                          {req.lines.map((l, idx) => (
                            <li key={idx}>{l.qty}x {l.partName}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1, color: '#dc2626' }}
                        disabled={processingId === req.id}
                        onClick={async () => {
                          setProcessingId(req.id);
                          await onReject(req.id);
                          setProcessingId(null);
                        }}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1.5 }}
                        disabled={processingId === req.id}
                        onClick={async () => {
                          setProcessingId(req.id);
                          await onApprove(req.id);
                          setProcessingId(null);
                        }}
                      >
                        {processingId === req.id ? 'Approving...' : 'Approve & Issue'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Who Has What & Overdue */}
        {activeTab === 'who-has-what' && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Active checkouts. Items past expected return date are marked <strong>OVERDUE in red</strong>.
            </p>

            {activeIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                🎉 No items currently out on loan.
              </div>
            ) : (
              <div className="grid">
                {activeIssues.map((issue) => (
                  <div key={issue.id} className={`card ${issue.isOverdue ? 'overdue-card' : ''}`}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{issue.title}</h3>
                        {issue.isOverdue ? (
                          <span className="badge badge-overdue">OVERDUE</span>
                        ) : (
                          <span className="badge badge-warning">Active</span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                        <div><strong>Participant:</strong> {issue.memberName} (<code>{issue.regNo}</code>)</div>
                        <div><strong>Pickup Code:</strong> <code>{issue.code}</code></div>
                        <div><strong>Borrowed At:</strong> {new Date(issue.borrowingAt).toLocaleString()}</div>
                        <div style={{ color: issue.isOverdue ? '#dc2626' : 'inherit', fontWeight: issue.isOverdue ? 700 : 'normal' }}>
                          <strong>Expected Return:</strong> {new Date(issue.dueDate).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ background: issue.isOverdue ? '#fee2e2' : '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        <strong>Issued Items:</strong>
                        <ul style={{ paddingLeft: '1.2rem', margin: '0.2rem 0 0 0' }}>
                          {issue.lines.map((l, idx) => (
                            <li key={idx}>{l.qty}x {l.partName}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        className="btn btn-success"
                        style={{ width: '100%' }}
                        disabled={processingId === issue.id}
                        onClick={async () => {
                          setProcessingId(issue.id);
                          await onMarkReturn(issue.id);
                          setProcessingId(null);
                        }}
                      >
                        ✓ Mark Returned (Good Condition)
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', color: '#b45309', borderColor: '#fde68a' }}
                        disabled={processingId === issue.id}
                        onClick={() => handleOpenDefectiveModal(issue)}
                      >
                        ⚠️ Mark Defective & Replace Kit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Customize Kits & Parts */}
        {activeTab === 'kit-editor' && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                Manage or create kits, add new components, and set lab stock counts.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowAddPartModal(true)}>
                  + Add New Part
                </button>
                <button className="btn btn-primary" onClick={handleOpenCreateKit}>
                  + Create New Kit
                </button>
              </div>
            </div>

            {/* Section A: Configured Kits */}
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: '#1e293b' }}>
              🚀 Kits Configured for Participants
            </h2>
            <div className="grid">
              {kits.map((kit) => (
                <div key={kit.id} className="card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{kit.name}</h3>
                      <span className="badge badge-success">Can Issue: {kit.canIssueCount}</span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <strong style={{ color: '#475569' }}>Contents:</strong>
                      <ul style={{ paddingLeft: '1.2rem', margin: '0.3rem 0 0 0' }}>
                        {kit.items.map((it, idx) => (
                          <li key={idx}>
                            {it.qty}x {it.partName}{' '}
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                              ({it.available} in stock)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                      onClick={() => handleOpenKitEditor(kit)}
                    >
                      ✏️ Edit Kit Components
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Section B: Parts Inventory & Stock Management */}
            <div style={{ marginTop: '2.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: '#1e293b' }}>
                📦 Lab Parts Inventory (Set Owned Stock)
              </h2>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Part Name</th>
                      <th>Category</th>
                      <th>Available / Total Owned</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{p.category}</span></td>
                        <td><strong>{p.available}</strong> / {p.total}</td>
                        <td>
                          {p.available === 0 ? (
                            <span className="badge badge-low">Out of Stock</span>
                          ) : p.isLowStock ? (
                            <span className="badge badge-low">Low Stock</span>
                          ) : (
                            <span className="badge badge-success">In Stock</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => {
                              setEditingPartStock(p);
                              setEditTotalCount(p.total);
                            }}
                          >
                            ✏️ Edit Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. Member History */}
        {activeTab === 'history' && (
          <div style={{ marginTop: '1rem' }}>
            <div className="controls-bar">
              <input
                type="text"
                placeholder="Filter by Registration No (e.g. 22BCE1234)..."
                className="search-input"
                value={searchRegNo}
                onChange={(e) => setSearchRegNo(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Item / Kit</th>
                    <th>Participant</th>
                    <th>Reg No</th>
                    <th>Borrowed At</th>
                    <th>Condition / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((issue) => (
                      <tr key={issue.id}>
                        <td>
                          {issue.status === 'returned' ? (
                            <span className="badge badge-success">Returned</span>
                          ) : issue.isOverdue ? (
                            <span className="badge badge-overdue">Overdue</span>
                          ) : issue.status === 'pending' ? (
                            <span className="badge badge-warning">Pending</span>
                          ) : (
                            <span className="badge badge-warning">Issued</span>
                          )}
                        </td>
                        <td><strong>{issue.title}</strong></td>
                        <td>{issue.memberName}</td>
                        <td><code>{issue.regNo}</code></td>
                        <td>{new Date(issue.borrowingAt).toLocaleDateString()}</td>
                        <td>
                          {issue.condition === 'defective' ? (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>
                              ⚠️ Defective ({issue.defectiveNote})
                            </span>
                          ) : (
                            <span style={{ color: '#16a34a' }}>Good</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create Brand New Kit (with Inline Part Creation) */}
      {showCreateKitModal && (
        <div className="modal-overlay" onClick={() => setShowCreateKitModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              🚀 Create New Robotics Kit
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Define a kit and add components from inventory or create brand new components.
            </p>

            {createKitError && <div className="alert-error">{createKitError}</div>}

            <form onSubmit={handleSaveNewKit}>
              <div className="form-group">
                <label>Kit Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bluetooth RC Car Kit, L298N Motor Driver Kit"
                  value={newKitName}
                  onChange={(e) => setNewKitName(e.target.value)}
                  required
                />
              </div>

              {/* Added components in new kit */}
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#334155' }}>
                  Kit Components Added ({newKitItems.length}):
                </strong>
                {newKitItems.length === 0 ? (
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                    No parts added yet. Add an existing part or create a new part below.
                  </div>
                ) : (
                  newKitItems.map((it) => (
                    <div
                      key={it.partId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.45rem 0.6rem',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        marginBottom: '0.35rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span><strong>{it.qty}x</strong> {it.partName} <small style={{ color: '#64748b' }}>({it.available} in lab)</small></span>
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => handleRemoveItemFromNewKit(it.partId)}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Part Section */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>+ Add Component:</strong>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => setInlineCreatePart(!inlineCreatePart)}
                  >
                    {inlineCreatePart ? '← Choose from Existing Parts' : '+ Create Brand New Part (e.g. L298N)'}
                  </button>
                </div>

                {!inlineCreatePart ? (
                  /* Option 1: Pick from existing parts */
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      style={{ flex: 2, padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      value={createKitSelectedPartId}
                      onChange={(e) => setCreateKitSelectedPartId(e.target.value)}
                    >
                      {parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.available} available)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      title="Quantity needed for this kit"
                      style={{ width: '60px', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={createKitSelectedQty}
                      onChange={(e) => setCreateKitSelectedQty(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddItemToNewKit}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  /* Option 2: Create brand new part right here! */
                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Part name (e.g. L298N Motor Driver, Actuator)"
                        value={inlinePartName}
                        onChange={(e) => setInlinePartName(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <select
                        value={inlinePartCategory}
                        onChange={(e) => setInlinePartCategory(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        {['Drivers', 'Motors', 'Sensors', 'Microcontrollers', 'Actuators', 'Mechanical', 'Power'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1, fontSize: '0.8rem', color: '#475569' }}>
                        Lab Total Stock:
                        <input
                          type="number"
                          min="1"
                          value={inlinePartTotal}
                          onChange={(e) => setInlinePartTotal(e.target.value)}
                          style={{ width: '60px', marginLeft: '0.3rem', padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div style={{ flex: 1, fontSize: '0.8rem', color: '#475569' }}>
                        Qty in Kit:
                        <input
                          type="number"
                          min="1"
                          value={createKitSelectedQty}
                          onChange={(e) => setCreateKitSelectedQty(e.target.value)}
                          style={{ width: '50px', marginLeft: '0.3rem', padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={handleAddInlinePartToNewKit}
                      >
                        Save & Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateKitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create & Publish Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Part Lab Stock */}
      {editingPartStock && (
        <div className="modal-overlay" onClick={() => setEditingPartStock(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Adjust Lab Stock: {editingPartStock.name}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Currently {editingPartStock.available} available out of {editingPartStock.total} total owned.
            </p>

            <form onSubmit={handleSavePartStock}>
              <div className="form-group">
                <label>Total Units Owned by Lab *</label>
                <input
                  type="number"
                  min="0"
                  value={editTotalCount}
                  onChange={(e) => setEditTotalCount(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingPartStock(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Stock Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Inventory Part */}
      {showAddPartModal && (
        <div className="modal-overlay" onClick={() => setShowAddPartModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>+ Add Inventory Part</h2>
            <form onSubmit={handleSaveNewPart}>
              <div className="form-group">
                <label>Part Name *</label>
                <input
                  type="text"
                  placeholder="e.g. L298N Dual Motor Driver, Linear Actuator"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select value={newPartCategory} onChange={(e) => setNewPartCategory(e.target.value)}>
                  {['Drivers', 'Actuators', 'Sensors', 'Microcontrollers', 'Motors', 'Mechanical', 'Power'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Total Inventory Owned *</label>
                <input
                  type="number"
                  min="1"
                  value={newPartTotal}
                  onChange={(e) => setNewPartTotal(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Low Stock Warning Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={newPartThreshold}
                  onChange={(e) => setNewPartThreshold(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPartModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Defective Return & Replacement */}
      {defectiveModalTarget && (
        <div className="modal-overlay" onClick={() => setDefectiveModalTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#991b1b' }}>
              ⚠️ Defective Return & Replacement
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Mark this returned kit (<code>{defectiveModalTarget.code}</code>) as defective, approve the return, and automatically issue a fresh replacement kit to <strong>{defectiveModalTarget.memberName}</strong>.
            </p>

            <form onSubmit={handleConfirmDefective}>
              <div className="form-group">
                <label>Select Defective Component</label>
                <select
                  value={defectivePartId}
                  onChange={(e) => setDefectivePartId(e.target.value)}
                >
                  {defectiveModalTarget.lines.map((l) => (
                    <option key={l.partId} value={l.partId}>
                      {l.partName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Defect Notes *</label>
                <input
                  type="text"
                  placeholder="e.g. Motor burned out / sensor pins broken"
                  value={defectiveNote}
                  onChange={(e) => setDefectiveNote(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDefectiveModalTarget(null)}
                  disabled={defectiveLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#b45309' }} disabled={defectiveLoading}>
                  {defectiveLoading ? 'Processing...' : 'Approve Return & Issue Replacement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kit Component Editor */}
      {editingKit && (
        <div className="modal-overlay" onClick={() => setEditingKit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Customizing: {editingKit.name}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Add or remove parts. Updated contents appear immediately on the Participant portal.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Current Items in Kit:
              </strong>
              {kitItems.map((it) => (
                <div
                  key={it.partId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    marginBottom: '0.4rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <span>{it.qty}x {it.partName}</span>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => handleRemovePartFromKit(it.partId)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1rem' }}>
              <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                + Add Part to this Kit:
              </strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  style={{ flex: 2, padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  value={selectedAddPartId}
                  onChange={(e) => setSelectedAddPartId(e.target.value)}
                >
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.available} available)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  style={{ width: '60px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={selectedAddQty}
                  onChange={(e) => setSelectedAddQty(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddPartToKit}
                >
                  Add
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingKit(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveKit}>
                Save Kit Contents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
