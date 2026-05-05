import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const API_BASE = 'http://127.0.0.1:3000';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <h2 style={{ marginTop: '20px' }}>Starting PharmaDesk...</h2>
      <p style={{ opacity: 0.8 }}>Please wait while we connect to the server</p>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#fee',
      color: '#333',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#c00', marginBottom: '10px' }}>Connection Error</h2>
      <p style={{ marginBottom: '20px' }}>{message}</p>
      <button 
        onClick={onRetry}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Retry Connection
      </button>
    </div>
  )
}

async function checkBackendHealth(retries = 30, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

async function initializeApp() {
  const [isReady] = await Promise.all([
    checkBackendHealth()
  ]);
  
  return isReady;
}

let isReady = false;

initializeApp().then(ready => {
  isReady = ready;
  
  if (!isReady) {
    console.warn('Backend not ready, app will attempt to connect...');
  }
  
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
