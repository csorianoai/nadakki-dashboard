'use client';

import AgentsPanel from './components/AgentsPanel';

export default function AdvertisingPage() {
  return (
    <div style={{minHeight: '100vh', padding: '32px', backgroundColor: '#f9fafb'}}>
      <h1 style={{fontSize: '36px', fontWeight: 'bold', marginBottom: '16px'}}>
        Advertising Manager
      </h1>
      <p style={{color: '#666', marginBottom: '32px'}}>
        Multi-platform advertising with AI agents
      </p>
      <div style={{marginBottom: '32px', padding: '24px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px'}}>
        <p style={{color: '#166534'}}>System Status: Connected and Ready</p>
      </div>
      <AgentsPanel />
      <div style={{marginTop: '48px', padding: '24px', backgroundColor: '#111827', color: 'white', borderRadius: '8px'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'}}>
          API Documentation
        </h2>
        <a 
          href="https://nadakki-ai-suite.onrender.com/docs" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{display: 'inline-block', padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', textDecoration: 'none'}}
        >
          View API Docs
        </a>
      </div>
    </div>
  );
}
