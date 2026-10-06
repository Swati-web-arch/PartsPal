import { useEffect, useState } from 'react';

function App() {
  const [healthStatus, setHealthStatus] = useState('checking...');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then((data) => setHealthStatus(`Connected! Server time: ${data.timestamp}`))
      .catch((err) => setHealthStatus(`Connection failed: ${err.message}`));
  }, [apiUrl]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>PartsPal 🤖</h1>
      <p>Robotics Club Lab Inventory</p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <strong>Backend status:</strong> {healthStatus}
      </div>
    </div>
  );
}

export default App;
