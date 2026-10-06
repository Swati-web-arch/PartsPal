import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScannerModal({ issues, onApprove, onReject, onClose }) {
  const scannerRef = useRef(null);
  const [matchedIssue, setMatchedIssue] = useState(null);
  const [notFound, setNotFound] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);

  // Look up a pickup code in the pending issues list
  function lookupCode(code) {
    const trimmed = code.trim().toUpperCase();
    const found = issues.find(
      (i) => i.code && i.code.toUpperCase() === trimmed && i.status === 'pending'
    );
    if (found) {
      setMatchedIssue(found);
      setNotFound('');
      // Stop scanner after successful match
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    } else {
      setMatchedIssue(null);
      setNotFound(`No pending request found for code: ${code.trim()}`);
    }
  }

  // Start the html5-qrcode scanner inside the #qr-reader div
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // On successful scan, extract the pickup code
        // QR value may be a raw code like "K-4821" or a kit label like "KIT:k1:..."
        let code = decodedText.trim();
        if (code.startsWith('KIT:') || code.startsWith('PART:')) {
          // Shelf-label QR — not a pickup code
          setNotFound(`"${code}" is a shelf label, not a pickup code.`);
          setMatchedIssue(null);
          return;
        }
        lookupCode(code);
      },
      (errorMessage) => {
        // Ignore per-frame scan errors (they happen on every non-QR frame)
      }
    );

    scannerRef.current = scanner;
    setScannerStarted(true);

    return () => {
      // Cleanup: stop camera when modal unmounts
      scanner.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleManualSearch() {
    if (!manualCode.trim()) return;
    lookupCode(manualCode);
  }

  function handleApprove() {
    if (!matchedIssue) return;
    onApprove(matchedIssue.id);
    onClose();
  }

  function handleReject() {
    if (!matchedIssue) return;
    onReject(matchedIssue.id);
    onClose();
  }

  function handleClose() {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal"
        style={{ maxWidth: '520px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>📷 Scan Participant QR</h2>
          <button className="btn" onClick={handleClose} style={{ fontSize: '1.4rem', lineHeight: 1 }}>
            ×
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Camera scanner — always shown until a match is found */}
          {!matchedIssue && (
            <>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Hold the participant's QR code (shown on their pickup screen) in front of the camera.
              </p>
              {/* html5-qrcode mounts itself into this div */}
              <div id="qr-reader" style={{ width: '100%' }} />
            </>
          )}

          {/* Manual code entry fallback */}
          {!matchedIssue && (
            <div>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                Or enter the pickup code manually:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="form-control"
                  placeholder="e.g. K-4821"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleManualSearch}>
                  Search
                </button>
              </div>
              {notFound && (
                <p style={{ color: 'var(--danger)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  ⚠️ {notFound}
                </p>
              )}
            </div>
          )}

          {/* Matched request card */}
          {matchedIssue && (
            <div
              style={{
                border: '2px solid var(--success)',
                borderRadius: '8px',
                padding: '1rem',
                background: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ margin: '0 0 0.75rem', color: 'var(--success)' }}>
                ✅ Request Found — {matchedIssue.code}
              </h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>Name</td>
                    <td>{matchedIssue.memberName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>Reg No.</td>
                    <td>{matchedIssue.regNo}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {matchedIssue.type === 'kit' ? 'Kit' : 'Part'}
                    </td>
                    <td>{matchedIssue.title}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>Borrowing At</td>
                    <td>{matchedIssue.borrowingAt ? new Date(matchedIssue.borrowingAt).toLocaleString() : '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>Due By</td>
                    <td>
                      {matchedIssue.dueDate
                        ? new Date(matchedIssue.dueDate).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-success"
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={handleApprove}
                >
                  ✓ Approve &amp; Issue
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={handleReject}
                >
                  ✗ Reject
                </button>
              </div>

              <button
                className="btn"
                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => {
                  setMatchedIssue(null);
                  setManualCode('');
                  setNotFound('');
                  // Restart scanner
                  setTimeout(() => {
                    const scanner = new Html5QrcodeScanner(
                      'qr-reader',
                      { fps: 10, qrbox: { width: 250, height: 250 } },
                      false
                    );
                    scanner.render(
                      (decodedText) => lookupCode(decodedText.trim()),
                      () => {}
                    );
                    scannerRef.current = scanner;
                  }, 100);
                }}
              >
                🔄 Scan Another Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
