import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MemberDashboard from './components/MemberDashboard';
import ClassList from './components/ClassList';
import MyProfile from './components/MyProfile';
import Reception from './components/Reception';
import Sparta from './components/Sparta';
import AuthForm from './components/AuthForm';
import EmailVerification from './components/EmailVerification';
import InvitationRegistration from './components/InvitationRegistration';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { DataProvider } from './contexts/DataContext';
import { isAuthenticated, logout as authLogout } from './services/authService';
import './styles.css';
// Import debug utilities for development
import './debug-utils';
// Import i18n configuration for multilingual support
import './i18n/config';

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
  role?: 'member' | 'admin' | 'reception' | 'sparta' | 'instructor';
}

export default function App() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<
    | 'home'
    | 'dashboard'
    | 'profile'
    | 'reception'
    | 'sparta'
    | 'auth'
    | 'verify-email'
    | 'invite-register'
    | 'register'
    | 'forgot-password'
    | 'reset-password'
  >('home');
  const [user, setUser] = useState<UserData | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Load remembered session, if any
  React.useEffect(() => {
    try {
      // Check URL for special routes
      const urlParams = new URLSearchParams(window.location.search);
      const path = window.location.pathname;

      // Check for registration token in URL (/register/TOKEN)
      if (path.startsWith('/register/')) {
        const token = path.split('/register/')[1];
        if (token) {
          setInvitationToken(token);
          setCurrentPage('register');
          return;
        }
      }

      // Check for reset password token in URL (/reset-password/TOKEN)
      if (path.startsWith('/reset-password/')) {
        const token = path.split('/reset-password/')[1];
        if (token) {
          setResetToken(token);
          setCurrentPage('reset-password');
          return;
        }
      }

      // Check if user is on invitation registration page (old format)
      const invToken = urlParams.get('invitation');
      if (invToken) {
        setInvitationToken(invToken);
        setCurrentPage('invite-register');
        return;
      }

      // Check if user is on email verification page
      if (path === '/verify-email' || urlParams.get('token')) {
        setCurrentPage('verify-email');
        return;
      }

      // ========== JWT TOKEN VALIDATION ==========
      // Check if user has valid JWT token
      if (isAuthenticated()) {
        console.log('✅ Valid JWT token found');
        // Try to get user data from either userData or viking_remembered_user
        const userData = localStorage.getItem('userData');
        const rememberedUser = localStorage.getItem('viking_remembered_user');
        const stored = userData || rememberedUser;

        if (stored) {
          const parsed: UserData = JSON.parse(stored);
          if (parsed?.isAuthenticated || parsed?.id) {
            setUser(parsed);
            setCurrentPage('dashboard');

            // 🔄 CRITICAL FIX: Fetch fresh profile from backend to sync avatar_url
            // This ensures profile photo is always up-to-date after page refresh
            (async () => {
              const { refreshUserProfile } = await import('./services/authService');
              const freshProfile = await refreshUserProfile();
              if (freshProfile) {
                console.log('🔄 [App] Synced profile from backend, updating user state...');
                setUser((prev) =>
                  prev ? { ...prev, ...freshProfile, isAuthenticated: true } : null,
                );
              }
            })();
          }
        }
      } else {
        console.log('⚠️ No valid JWT token found or token expired');
        // Clear any stale session data
        authLogout();
        setUser(null);
        setCurrentPage('home');
      }

      // Clean up old demo users with string IDs (pre-UUID fix)
      const demoUsers = localStorage.getItem('viking_demo_users');
      if (demoUsers) {
        try {
          const users = JSON.parse(demoUsers);
          let cleaned = false;

          // Remove only users with old string ID format
          Object.keys(users).forEach((email) => {
            const user = users[email];
            if (
              user?.profile?.id &&
              typeof user.profile.id === 'string' &&
              user.profile.id.startsWith('demo-')
            ) {
              console.log('🧹 Removing old demo user:', email, 'ID:', user.profile.id);
              delete users[email];
              cleaned = true;
            }
          });

          // Save cleaned users back or clear if empty
          if (cleaned) {
            if (Object.keys(users).length > 0) {
              localStorage.setItem('viking_demo_users', JSON.stringify(users));
              console.log('✅ Cleaned demo users, kept', Object.keys(users).length, 'valid users');
            } else {
              localStorage.removeItem('viking_demo_users');
              console.log('🧹 All demo users were old format, cleared storage');
            }

            // Also check if current user needs to be logged out
            const currentUser = localStorage.getItem('viking_current_user');
            if (currentUser) {
              try {
                const current = JSON.parse(currentUser);
                if (current?.id && current.id.startsWith('demo-')) {
                  localStorage.removeItem('viking_current_user');
                  localStorage.removeItem('viking_remembered_user');
                  console.log('🔓 Logged out old demo user');
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }
        } catch {
          // Invalid format, clear it
          localStorage.removeItem('viking_demo_users');
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
    authLogout(); // Clear JWT token and all auth data
    setCurrentPage('home');
  };

  const handleUserUpdate = (updatedUser: any) => {
    console.log('🔄 [App] Updating user data:', updatedUser);

    // Update user state with new data (e.g., profile photo)
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));

    // Update BOTH localStorage keys to prevent data loss on refresh
    try {
      // Update userData (used by JWT auth system)
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        const updated = { ...parsed, ...updatedUser };
        localStorage.setItem('userData', JSON.stringify(updated));
        console.log('✅ [App] Updated userData in localStorage');
      }

      // Also update viking_remembered_user (legacy support)
      const remembered = localStorage.getItem('viking_remembered_user');
      if (remembered) {
        const parsed = JSON.parse(remembered);
        const updated = { ...parsed, ...updatedUser };
        localStorage.setItem('viking_remembered_user', JSON.stringify(updated));
        console.log('✅ [App] Updated viking_remembered_user in localStorage');
      }
    } catch (error) {
      console.error('❌ [App] Failed to update stored user data:', error);
    }
  };

  const handleGetStarted = () => {
    setCurrentPage('auth');
  };

  const handleNavigate = (page: string) => {
    // Role-based access control
    const userRole = user?.role || 'member';

    // Check permissions before navigation
    if (page === 'reception') {
      // Only sparta and reception roles can access Reception
      if (userRole !== 'sparta' && userRole !== 'reception') {
        console.warn('⛔ Access denied: Reception page requires sparta or reception role');
        return;
      }
    } else if (page === 'sparta') {
      // Only sparta role can access Sparta
      if (userRole !== 'sparta') {
        console.warn('⛔ Access denied: Sparta page requires sparta role');
        return;
      }
    }

    if (page === 'home') {
      setCurrentPage('home');
    } else if (page === 'dashboard') {
      setCurrentPage('dashboard');
    } else if (page === 'profile') {
      setCurrentPage('profile');
    } else if (page === 'reception') {
      setCurrentPage('reception');
    } else if (page === 'sparta') {
      setCurrentPage('sparta');
    } else if (page === 'forgot-password') {
      setCurrentPage('forgot-password');
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

  // Show registration page (new invitation flow)
  if (currentPage === 'register') {
    return (
      <DataProvider>
        <Register
          token={invitationToken || ''}
          onSuccess={(userData, token) => {
            // Auto-login after successful registration
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(userData));
            setUser({
              ...userData,
              isAuthenticated: true,
            });
            setCurrentPage('dashboard');
          }}
          onCancel={() => {
            setCurrentPage('home');
            window.history.pushState({}, '', '/');
          }}
        />
      </DataProvider>
    );
  }

  // Show forgot password page
  if (currentPage === 'forgot-password') {
    return (
      <DataProvider>
        <ForgotPassword onBack={() => setCurrentPage('auth')} />
      </DataProvider>
    );
  }

  // Show reset password page
  if (currentPage === 'reset-password') {
    return (
      <DataProvider>
        <ResetPassword
          token={resetToken || ''}
          onSuccess={() => {
            // Redirect to login after successful password reset
            alert('Password reset successful! Please sign in with your new password.');
            setCurrentPage('auth');
            window.history.pushState({}, '', '/');
          }}
          onCancel={() => {
            setCurrentPage('forgot-password');
            window.history.pushState({}, '', '/');
          }}
        />
      </DataProvider>
    );
  }

  // Show invitation registration page (old flow - keeping for compatibility)
  if (currentPage === 'invite-register') {
    return (
      <DataProvider>
        <InvitationRegistration
          token={invitationToken || ''}
          onSuccess={() => setCurrentPage('auth')}
          onCancel={() => setCurrentPage('home')}
        />
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
                      {(user.role === 'sparta' || user.role === 'reception') && (
                        <button
                          className="cta-button secondary"
                          onClick={() => setCurrentPage('reception')}
                        >
                          🏢 Reception Panel
                        </button>
                      )}
                      {user.role === 'sparta' && (
                        <button
                          className="cta-button secondary"
                          onClick={() => setCurrentPage('sparta')}
                        >
                          ⚔️ Sparta Panel
                        </button>
                      )}
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
                🏠 {t('navigation.home')}
              </button>
              <button className="nav-btn active">📊 {t('navigation.dashboard')}</button>
              <button className="nav-btn" onClick={() => handleNavigate('profile')}>
                👤 {t('navigation.profile')}
              </button>
              {(user?.role === 'sparta' || user?.role === 'reception') && (
                <button className="nav-btn" onClick={() => handleNavigate('reception')}>
                  🏢 {t('navigation.reception')}
                </button>
              )}
              {user?.role === 'sparta' && (
                <button className="nav-btn" onClick={() => handleNavigate('sparta')}>
                  ⚔️ {t('navigation.sparta')}
                </button>
              )}
              <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
                🚪 {t('navigation.logout')}
              </button>
            </div>
            <MemberDashboard onNavigate={handleNavigate} user={user} />
          </div>
        ) : currentPage === 'reception' ? (
          <div>
            <div className="navigation-bar">
              <button className="nav-btn" onClick={() => handleNavigate('home')}>
                🏠 {t('navigation.home')}
              </button>
              <button className="nav-btn" onClick={() => handleNavigate('dashboard')}>
                📊 {t('navigation.dashboard')}
              </button>
              <button className="nav-btn" onClick={() => handleNavigate('profile')}>
                👤 {t('navigation.profile')}
              </button>
              <button className="nav-btn active">🏢 {t('navigation.reception')}</button>
              {user?.role === 'sparta' && (
                <button className="nav-btn" onClick={() => handleNavigate('sparta')}>
                  ⚔️ {t('navigation.sparta')}
                </button>
              )}
              <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
                🚪 {t('navigation.logout')}
              </button>
            </div>
            <Reception onNavigate={handleNavigate} user={user} />
          </div>
        ) : currentPage === 'sparta' ? (
          <div>
            <div className="navigation-bar">
              <button className="nav-btn" onClick={() => handleNavigate('home')}>
                🏠 {t('navigation.home')}
              </button>
              <button className="nav-btn" onClick={() => handleNavigate('dashboard')}>
                📊 {t('navigation.dashboard')}
              </button>
              <button className="nav-btn" onClick={() => handleNavigate('profile')}>
                👤 {t('navigation.profile')}
              </button>
              <button className="nav-btn" onClick={() => handleNavigate('reception')}>
                🏢 {t('navigation.reception')}
              </button>
              <button className="nav-btn active">⚔️ {t('navigation.sparta')}</button>
              <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
                🚪 {t('navigation.logout')}
              </button>
            </div>
            <Sparta onNavigate={handleNavigate} user={user} />
          </div>
        ) : (
          <div>
            <div className="navigation-bar">
              <button className="nav-btn" onClick={() => handleNavigate('home')}>
                🏠 {t('navigation.home')}
              </button>
              <button className="nav-btn" onClick={() => handleNavigate('dashboard')}>
                📊 {t('navigation.dashboard')}
              </button>
              <button className="nav-btn active">👤 {t('navigation.profile')}</button>
              {(user?.role === 'sparta' || user?.role === 'reception') && (
                <button className="nav-btn" onClick={() => handleNavigate('reception')}>
                  🏢 {t('navigation.reception')}
                </button>
              )}
              {user?.role === 'sparta' && (
                <button className="nav-btn" onClick={() => handleNavigate('sparta')}>
                  ⚔️ {t('navigation.sparta')}
                </button>
              )}
              <button className="nav-btn logout" onClick={() => handleNavigate('logout')}>
                🚪 {t('navigation.logout')}
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
