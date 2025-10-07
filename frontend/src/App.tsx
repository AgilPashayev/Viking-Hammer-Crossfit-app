import React, { useState } from 'react';
import MemberDashboard from './components/MemberDashboard';
import MyProfile from './components/MyProfile';
import AuthForm from './components/AuthForm';
import './styles.css';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  membershipType: string;
  joinDate: string;
  isAuthenticated: boolean;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'profile' | 'auth'>('home');
  const [user, setUser] = useState<UserData | null>(null);

  const handleLogin = (userData: UserData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  const handleGetStarted = () => {
    setCurrentPage('auth');
  };

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      setCurrentPage('home');
    } else if (page === 'dashboard') {
      setCurrentPage('dashboard');
    } else if (page === 'profile') {
      setCurrentPage('profile');
    } else if (page === 'logout') {
      handleLogout();
    }
  };

  // Show authentication form if not authenticated
  if (currentPage === 'auth' || (!user && currentPage !== 'home')) {
    return <AuthForm onLogin={handleLogin} onNavigate={handleNavigate} />;
  }

  return (
    <div className="app-root">
      {currentPage === 'home' ? (
        <div className="landing-page">
          <header className="landing-header">
            <div className="logo">
              <h1>🔨 Viking Hammer CrossFit</h1>
            </div>
            {user && (
              <div className="user-menu">
                <span>Welcome, {user.firstName}!</span>
                <button onClick={() => setCurrentPage('dashboard')} className="nav-button">
                  Dashboard
                </button>
                <button onClick={handleLogout} className="nav-button secondary">
                  Logout
                </button>
              </div>
            )}
          </header>
          <main className="landing-main">
            <div className="hero-section">
              <h2>Welcome to Viking Hammer CrossFit</h2>
              <p>
                Transform your body, forge your spirit, and join the strongest community in town.
              </p>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Active Members</span>
                </div>
                <div className="stat">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Daily Classes</span>
                </div>
                <div className="stat">
                  <span className="stat-number">10+</span>
                  <span className="stat-label">Expert Trainers</span>
                </div>
              </div>
              <div className="cta-buttons">
                {!user ? (
                  <>
                    <button className="cta-button primary" onClick={handleGetStarted}>
                      🔨 Start Your Journey
                    </button>
                    <button className="cta-button secondary" onClick={() => setCurrentPage('auth')}>
                      Sign In
                    </button>
                  </>
                ) : (
                  <button
                    className="cta-button primary"
                    onClick={() => setCurrentPage('dashboard')}
                  >
                    🏋️ Go to Dashboard
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      ) : currentPage === 'dashboard' ? (
        <div>
          <div className="navigation-bar">
            <button className="nav-btn" onClick={() => handleNavigate('home')}>
              🏠 Home
            </button>
            <button className="nav-btn active">📊 Dashboard</button>
            <button className="nav-btn" onClick={() => handleNavigate('profile')}>
              👤 Profile
            </button>
            <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
              🚪 Logout
            </button>
          </div>
          <MemberDashboard onNavigate={handleNavigate} />
        </div>
      ) : (
        <div>
          <div className="navigation-bar">
            <button className="nav-btn" onClick={() => handleNavigate('home')}>
              🏠 Home
            </button>
            <button className="nav-btn" onClick={() => handleNavigate('dashboard')}>
              📊 Dashboard
            </button>
            <button className="nav-btn active">👤 Profile</button>
            <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
              🚪 Logout
            </button>
          </div>
          <MyProfile onNavigate={handleNavigate} />
        </div>
      )}
    </div>
  );
}
