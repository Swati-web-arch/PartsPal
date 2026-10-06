// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  fetchParts,
  fetchKits,
  fetchIssues,
  submitRequest,
  approveRequest,
  rejectRequest,
  markReturned,
  addPart
} from './api';
import InventoryView from './components/InventoryView';
import KitsView from './components/KitsView';
import PendingQueueView from './components/PendingQueueView';
import WhoHasWhatView from './components/WhoHasWhatView';
import HistoryView from './components/HistoryView';
import IssueModal from './components/IssueModal';
import AddPartModal from './components/AddPartModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [parts, setParts] = useState([]);
  const [kits, setKits] = useState([]);
  const [issues, setIssues] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modals state
  const [issueTarget, setIssueTarget] = useState(null);
  const [showAddPart, setShowAddPart] = useState(false);
  const [loadingReturnId, setLoadingReturnId] = useState(null);

  const showMessage = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    try {
      const [partsData, kitsData, issuesData] = await Promise.all([
        fetchParts(search, category),
        fetchKits(),
        fetchIssues()
      ]);
      setParts(partsData);
      setKits(kitsData);
      setIssues(issuesData);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, category]);

  // Student submits request
  const handleRequestSubmit = async (payload) => {
    const result = await submitRequest(payload);
    showMessage(`Request submitted! Pickup code: ${result.code}`);
    await loadData();
    return result;
  };

  // Assistant approves request
  const handleApprove = async (id) => {
    try {
      const result = await approveRequest(id);
      showMessage(`Approved ${result.title} for ${result.memberName}! Stock updated.`);
      await loadData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Assistant rejects request
  const handleReject = async (id) => {
    try {
      const result = await rejectRequest(id);
      showMessage(`Request ${result.code} rejected.`, 'error');
      await loadData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Assistant marks return
  const handleMarkReturn = async (issueId) => {
    setLoadingReturnId(issueId);
    try {
      const result = await markReturned(issueId);
      showMessage(`Returned ${result.title} and restored stock!`);
      await loadData();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoadingReturnId(null);
    }
  };

  // Add part
  const handleAddPart = async (newPartData) => {
    const created = await addPart(newPartData);
    showMessage(`Added ${created.name} to inventory!`);
    await loadData();
  };

  const pendingCount = issues.filter((i) => i.status === 'pending').length;
  const activeIssuesCount = issues.filter((i) => i.status === 'issued').length;
  const overdueCount = issues.filter((i) => i.status === 'issued' && i.isOverdue).length;

  return (
    <div>
      {/* Top Navigation Bar */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <span>🤖</span> PartsPal
          </div>

          <nav className="nav-tabs">
            <button
              className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory ({parts.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'kits' ? 'active' : ''}`}
              onClick={() => setActiveTab('kits')}
            >
              Kits ({kits.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Requests
              {pendingCount > 0 && (
                <span
                  style={{
                    marginLeft: '0.4rem',
                    background: '#f59e0b',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '0.1rem 0.45rem',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === 'who-has-what' ? 'active' : ''}`}
              onClick={() => setActiveTab('who-has-what')}
            >
              Who Has What ({activeIssuesCount})
              {overdueCount > 0 && (
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
                  {overdueCount} overdue
                </span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Member History
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container">
        {notification && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              backgroundColor: notification.type === 'error' ? '#fef2f2' : '#ecfdf5',
              border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#a7f3d0'}`,
              color: notification.type === 'error' ? '#991b1b' : '#065f46',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            {notification.msg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Loading PartsPal data...
          </div>
        ) : (
          <>
            {activeTab === 'inventory' && (
              <InventoryView
                parts={parts}
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                onOpenIssueModal={setIssueTarget}
                onOpenAddPartModal={() => setShowAddPart(true)}
              />
            )}

            {activeTab === 'kits' && (
              <KitsView kits={kits} onOpenIssueModal={setIssueTarget} />
            )}

            {activeTab === 'pending' && (
              <PendingQueueView
                issues={issues}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}

            {activeTab === 'who-has-what' && (
              <WhoHasWhatView
                issues={issues}
                onMarkReturn={handleMarkReturn}
                loadingReturnId={loadingReturnId}
              />
            )}

            {activeTab === 'history' && <HistoryView issues={issues} />}
          </>
        )}
      </main>

      {issueTarget && (
        <IssueModal
          target={issueTarget}
          onClose={() => setIssueTarget(null)}
          onSubmit={handleRequestSubmit}
        />
      )}

      {showAddPart && (
        <AddPartModal
          onClose={() => setShowAddPart(false)}
          onAdd={handleAddPart}
        />
      )}
    </div>
  );
}
