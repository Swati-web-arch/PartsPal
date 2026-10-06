// client/src/components/QRCodeModal.jsx
import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeModal({ title, value, subtitle, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    }
  }, [value]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{title}</h2>
        {subtitle && <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>{subtitle}</p>}

        <div style={{ display: 'inline-block', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '0.5rem 0' }}>
          <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
          <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: '#2563eb', letterSpacing: '1px' }}>
            {value}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
