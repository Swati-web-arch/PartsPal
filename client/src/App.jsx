// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  fetchParts,
  fetchKits,
  fetchIssues,
  issueItem,
  markReturned,
  addPart
} from './api';
import InventoryView from './components/InventoryView';
import KitsView from './components/KitsView';
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
  const [issueTarget, setIssueTarget] = useState(null); // { type: 'part'|'kit', item: {...} }
  const [showAddPart, setShowAddPart] = useState(false);
  const [loadingReturnId, setLoadingReturnId] = useState(null);

  // Notification helper
  const showMessage = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load all initial data
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

  // Handle issuing item or kit
  const handleIssueSubmit = async (payload) => {
    const result = await issueItem(payload);
    showMessage(`Issued ${result.title} to ${result.memberName} successfully!`);
    await loadData();
  };

  // Handle return
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

  // Handle adding part
  const handleAddPart = async (newPartData) => {
    const created = await addPart(newPartData);
    showMessage(`Added ${created.name} to inventory!`);
    await loadData();
  };

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
        {/* Banner Alert */}
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

      {/* Issue Modal */}
      {issueTarget && (
        <IssueModal
          target={issueTarget}
          onClose={() => setIssueTarget(null)}
          onSubmit={handleIssueSubmit}
        />
      )}

      {/* Add Part Modal */}
      {showAddPart && (
        <AddPartModal
          onClose={() => setShowAddPart(false)}
          onAdd={handleAddPart}
        />
      )}
    </div>
  );
}
