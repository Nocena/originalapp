'use client';

import { useState, useEffect } from 'react';
import { greet } from '@nocena/indexer';

export default function Home() {
  const [message, setMessage] = useState('');
  const [apiData, setApiData] = useState<{ message: string } | null>(null);

  useEffect(() => {
    // Test shared package
    setMessage(greet('Nocena'));

    // Test backend API
    fetch('http://localhost:4000/api/health')
      .then((res) => res.json())
      .then((data) => setApiData(data))
      .catch((err) => console.error('Backend not running:', err));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🚀 Nocena Monorepo</h1>
      <div style={{ marginTop: '2rem' }}>
        <h2>Frontend (Next.js 15.1.4)</h2>
        <p>✅ Next.js app is running!</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Shared Package Test</h2>
        <p>Message from @nocena/indexer: <strong>{message}</strong></p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Backend API Test</h2>
        {apiData ? (
          <p>✅ Backend response: <strong>{apiData.message}</strong></p>
        ) : (
          <p>⏳ Waiting for backend (start with: pnpm dev)</p>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h3>Quick Start:</h3>
        <ol>
          <li>Install dependencies: <code>pnpm install</code></li>
          <li>Run dev servers: <code>pnpm dev</code></li>
          <li>Frontend: http://localhost:3000</li>
          <li>Backend: http://localhost:4000</li>
        </ol>
      </div>
    </div>
  );
}

