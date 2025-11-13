import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
// Import debug utilities to make them available in console
import './debug-utils';

// Clear mock data from cache - one-time cleanup
if (localStorage.getItem('viking-cache-version') !== 'v1.0-no-mock-data') {
  console.log('🧹 Clearing old mock data from cache...');
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('viking-cache-version', 'v1.0-no-mock-data');
  console.log('✅ Cache cleared - All mock data removed');
}

const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
