// client/src/api.js
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Normalize: remove trailing slash, ensure it ends with /api
const cleanUrl = rawUrl.replace(/\/+$/, '');
const API_BASE = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Authentication failed');
  return data;
}

export async function fetchParts(search = '', category = 'All') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'All') params.append('category', category);

  const res = await fetch(`${API_BASE}/parts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch parts');
  return res.json();
}

export async function addPart(partData) {
  const res = await fetch(`${API_BASE}/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add part');
  return data;
}

export async function updatePartStock(partId, updateData) {
  const res = await fetch(`${API_BASE}/parts/${partId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update part stock');
  return data;
}

export async function fetchKits() {
  const res = await fetch(`${API_BASE}/kits`);
  if (!res.ok) throw new Error('Failed to fetch kits');
  return res.json();
}

export async function createKit(kitData) {
  const res = await fetch(`${API_BASE}/kits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kitData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create kit');
  return data;
}

export async function updateKit(kitId, payload) {
  const res = await fetch(`${API_BASE}/kits/${kitId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update kit');
  return data;
}

export async function fetchIssues(status = '', regNo = '') {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (regNo) params.append('regNo', regNo);

  const res = await fetch(`${API_BASE}/issues?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
}

export async function submitRequest(payload) {
  const res = await fetch(`${API_BASE}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit request');
  return data;
}

export async function approveRequest(issueId, issuedByName = 'OC Member') {
  const res = await fetch(`${API_BASE}/issues/${issueId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issuedByName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve request');
  return data;
}

export async function rejectRequest(issueId) {
  const res = await fetch(`${API_BASE}/issues/${issueId}/reject`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reject request');
  return data;
}

export async function markReturned(issueId) {
  const res = await fetch(`${API_BASE}/issues/${issueId}/return`, {
    method: 'PATCH'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to mark return');
  return data;
}

export async function markDefectiveReturn(issueId, payload) {
  const res = await fetch(`${API_BASE}/issues/${issueId}/return-defective`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to process defective return');
  return data;
}
