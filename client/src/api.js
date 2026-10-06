// client/src/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export async function fetchKits() {
  const res = await fetch(`${API_BASE}/kits`);
  if (!res.ok) throw new Error('Failed to fetch kits');
  return res.json();
}

export async function fetchIssues(status = '', regNo = '') {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (regNo) params.append('regNo', regNo);

  const res = await fetch(`${API_BASE}/issues?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
}

export async function issueItem(payload) {
  const res = await fetch(`${API_BASE}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to issue item');
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
