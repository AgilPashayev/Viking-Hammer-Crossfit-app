import React, { useState } from 'react';
import MemberDashboard from './components/MemberDashboard';
import MyProfile from './components/MyProfile';
import Reception from './components/Reception';
import AuthForm from './components/AuthForm';
import EmailVerification from './components/EmailVerification';
import { DataProvider } from './contexts/DataContext';
import './styles.css';
// Import debug utilities for development
import './debug-utils';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  countryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactCountryCode?: string;
  membershipType: string;
  joinDate: string;
  isAuthenticated: boolean;
  avatar_url?: string;
  profilePhoto?: string;
  role?: 'member' | 'admin' | 'reception' | 'instructor';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    'home' | 'dashboard' | 'profile' | 'reception' | 'auth' | 'verify-email'
  >('home');
  const [user, setUser] = useState<UserData | null>(null);

  // Load remembered session, if any
  React.useEffect(() => {
    try {
      // Check if user is on email verification page
      if (window.location.pathname === '/verify-email' || window.location.search.includes('token=')) {
        setCurrentPage('verify-email');
        return;
      }
      
      const stored = localStorage.getItem('viking_remembered_user');
      if (stored) {
        const parsed: UserData = JSON.parse(stored);
        if (parsed?.isAuthenticated) {
          setUser(parsed);
          setCurrentPage('dashboard');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = (userData: UserData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    try { localStorage.removeItem('viking_remembered_user'); } catch {}
    setCurrentPage('home');
  };
  
  const handleUserUpdate = (updatedUser: any) => {
    // Update user state with new data (e.g., profile photo)
    setUser(prev => prev ? { ...prev, ...updatedUser } : null);
    
    // Also update localStorage if user was remembered
    try {
      const stored = localStorage.getItem('viking_remembered_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = { ...parsed, ...updatedUser };
        localStorage.setItem('viking_remembered_user', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to update stored user data:', error);
    }
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
    } else if (page === 'reception') {
      setCurrentPage('reception');
    } else if (page === 'logout') {
      handleLogout();
    }
  };

  // Show email verification page
  if (currentPage === 'verify-email') {
    return (
      <DataProvider>
        <EmailVerification onNavigate={handleNavigate} />
      </DataProvider>
    );
  }

  // Show authentication form if not authenticated
  if (currentPage === 'auth' || (!user && currentPage !== 'home')) {
    return (
      <DataProvider>
        <AuthForm onLogin={handleLogin} onNavigate={handleNavigate} />
      </DataProvider>
    );
  }

  return (
    <DataProvider>
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
                      <button
                        className="cta-button secondary"
                        onClick={() => setCurrentPage('auth')}
                      >
                        Sign In
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="cta-button primary"
                        onClick={() => setCurrentPage('dashboard')}
                      >
                        🏋️ Go to Dashboard
                      </button>
                      <button
                        className="cta-button secondary"
                        onClick={() => setCurrentPage('reception')}
                      >
                        🏢 Reception Panel
                      </button>
                    </>
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
              <button className="nav-btn" onClick={() => handleNavigate('reception')}>
                🏢 Reception
              </button>
              <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
                🚪 Logout
              </button>
            </div>
            <MemberDashboard onNavigate={handleNavigate} user={user} />
          </div>
        ) : currentPage === 'reception' ? (
          <div>
            <div className="navigation-bar">
              <button className="nav-btn" onClick={() => handleNavigate('home')}>
                🏠 Home
              </button>
              <button className="nav-btn" onClick={() => handleNavigate('dashboard')}>
                📊 Dashboard
              </button>
              <button className="nav-btn" onClick={() => handleNavigate('profile')}>
                👤 Profile
              </button>
              <button className="nav-btn active">🏢 Reception</button>
              <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
                � Logout
              </button>
            </div>
            <Reception onNavigate={handleNavigate} />
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
              <button className="nav-btn active">�👤 Profile</button>
              <button className="nav-btn" onClick={() => handleNavigate('reception')}>
                🏢 Reception
              </button>
              <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
                🚪 Logout
              </button>
            </div>
            <MyProfile 
              onNavigate={handleNavigate} 
              user={user} 
              currentUserRole={user?.role as any}
              onUserUpdate={handleUserUpdate}
            />
          </div>
        )}
      </div>
    </DataProvider>
  );
}
