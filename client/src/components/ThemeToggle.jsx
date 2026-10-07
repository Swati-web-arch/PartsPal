// client/src/components/ThemeToggle.jsx
import React from 'react';

const OPTIONS = [
  { value: 'system', label: '💻 Auto' },
  { value: 'light',  label: '☀️ Light' },
  { value: 'dark',   label: '🌙 Dark' },
];

export default function ThemeToggle({ theme, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '2px',
      }}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.label}
          style={{
            padding: '0.3rem 0.55rem',
            fontSize: '0.78rem',
            fontWeight: theme === opt.value ? 700 : 400,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: theme === opt.value ? 'var(--primary)' : 'transparent',
            color: theme === opt.value ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
