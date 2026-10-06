// client/src/components/HistoryView.jsx
import React, { useState } from 'react';

export default function HistoryView({ issues }) {
  const [filterRegNo, setFilterRegNo] = useState('');

  const filteredIssues = issues.filter((issue) => {
    if (!filterRegNo.trim()) return true;
    return issue.regNo.toLowerCase().includes(filterRegNo.trim().toLowerCase());
  });

  return (
    <div>
      <div className="controls-bar">
        <input
          type="text"
          placeholder="Filter by Registration No (e.g. 22BCE1001)..."
          className="search-input"
          value={filterRegNo}
          onChange={(e) => setFilterRegNo(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Item / Kit</th>
              <th>Member</th>
              <th>Reg No</th>
              <th>Issued At</th>
              <th>Returned At</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No history records found.
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    {issue.status === 'returned' ? (
                      <span className="badge badge-success">Returned</span>
                    ) : issue.isOverdue ? (
                      <span className="badge badge-overdue">Overdue</span>
                    ) : (
                      <span className="badge badge-warning">Active</span>
                    )}
                  </td>
                  <td><strong>{issue.title}</strong></td>
                  <td>{issue.memberName}</td>
                  <td><code>{issue.regNo}</code></td>
                  <td>{new Date(issue.issuedAt).toLocaleDateString()}</td>
                  <td>{issue.returnedAt ? new Date(issue.returnedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
