import React, { useState } from 'react';
import MemberDashboard from './components/MemberDashboard';
import './styles.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home');

  return (
    <div className="app-root">
      {currentPage === 'home' ? (
        <div className="landing-page">
          <header className="landing-header">
            <div className="logo">
              <h1>🔨 Viking Hammer CrossFit</h1>
            </div>
          </header>
          <main className="landing-main">
            <div className="hero-section">
              <h2>Welcome to Viking Hammer CrossFit</h2>
              <p>Forge your strength. Build your legacy.</p>
              <div className="cta-buttons">
                <button className="btn btn-primary" onClick={() => setCurrentPage('dashboard')}>
                  Member Dashboard
                </button>
                <button className="btn btn-secondary">Join Today</button>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <MemberDashboard />
      )}
    </div>
  );
}
