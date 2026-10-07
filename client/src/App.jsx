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
  markDefectiveReturn,
  updateKit,
  createKit,
  addPart,
  updatePartStock
} from './api';
import AuthScreen from './components/AuthScreen';
import ParticipantPortal from './components/ParticipantPortal';
import OCPortal from './components/OCPortal';
import { getStoredTheme, applyTheme } from './utils/theme';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('partspal_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setTheme] = useState(getStoredTheme);

  const [parts, setParts] = useState([]);
  const [kits, setKits] = useState([]);
  const [issues, setIssues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showMessage = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadAllData = async () => {
    try {
      const [partsData, kitsData, issuesData] = await Promise.all([
        fetchParts(),
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
    loadAllData();
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('partspal_user', JSON.stringify(userData));
    showMessage(`Signed in as ${userData.roleName} (${userData.email})`);
    loadAllData();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('partspal_user');
    showMessage('Logged out. You can now switch role.');
  };

  // Participant submits request
  const handleRequestSubmit = async (payload) => {
    const result = await submitRequest(payload);
    showMessage(`Request submitted! Pickup code: ${result.code}`);
    await loadAllData();
    return result;
  };

  // OC Approves
  const handleApprove = async (id) => {
    try {
      const result = await approveRequest(id, user?.name || 'OC Member');
      showMessage(`Approved ${result.title} for ${result.memberName}!`);
      await loadAllData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // OC Rejects
  const handleReject = async (id) => {
    try {
      const result = await rejectRequest(id);
      showMessage(`Request ${result.code} rejected.`, 'error');
      await loadAllData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Normal Return
  const handleMarkReturn = async (id) => {
    try {
      const result = await markReturned(id);
      showMessage(`Returned ${result.title} and restored stock!`);
      await loadAllData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Defective Return & Replacement
  const handleMarkDefectiveReturn = async (id, payload) => {
    try {
      const result = await markDefectiveReturn(id, payload);
      showMessage(
        result.replacementIssue
          ? `Returned defective kit and issued replacement kit (${result.replacementIssue.code})!`
          : 'Returned defective kit successfully!'
      );
      await loadAllData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // OC creates new kit
  const handleCreateKit = async (kitData) => {
    try {
      const result = await createKit(kitData);
      showMessage(`Created kit "${result.name}" successfully!`);
      await loadAllData();
    } catch (err) {
      showMessage(err.message, 'error');
      throw err;
    }
  };

  // OC updates existing kit
  const handleUpdateKit = async (kitId, payload) => {
    try {
      const result = await updateKit(kitId, payload);
      showMessage(`Kit ${result.name} updated!`);
      await loadAllData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // OC adds part (returns created part for inline kit creation)
  const handleAddPart = async (partData) => {
    try {
      const result = await addPart(partData);
      showMessage(`Added ${result.name} to inventory!`);
      await loadAllData();
      return result;
    } catch (err) {
      showMessage(err.message, 'error');
      throw err;
    }
  };

  // OC updates part stock
  const handleUpdatePartStock = async (partId, updateData) => {
    try {
      const result = await updatePartStock(partId, updateData);
      showMessage(`Updated stock for ${result.name}!`);
      await loadAllData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Toast Banner */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 100,
            maxWidth: '400px',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: notification.type === 'error' ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#a7f3d0'}`,
            color: notification.type === 'error' ? '#991b1b' : '#065f46',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            fontWeight: 500,
            fontSize: '0.85rem'
          }}
        >
          {notification.msg}
        </div>
      )}

      {/* Auth Screen if not logged in */}
      {!user ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : user.role === 'p' ? (
        <ParticipantPortal
          user={user}
          parts={parts}
          kits={kits}
          issues={issues}
          onLogout={handleLogout}
          onRequestSubmit={handleRequestSubmit}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
      ) : (
        <OCPortal
          user={user}
          parts={parts}
          kits={kits}
          issues={issues}
          onLogout={handleLogout}
          onApprove={handleApprove}
          onReject={handleReject}
          onMarkReturn={handleMarkReturn}
          onMarkDefectiveReturn={handleMarkDefectiveReturn}
          onUpdateKit={handleUpdateKit}
          onCreateKit={handleCreateKit}
          onAddPart={handleAddPart}
          onUpdatePartStock={handleUpdatePartStock}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
      )}
    </div>
  );
}
