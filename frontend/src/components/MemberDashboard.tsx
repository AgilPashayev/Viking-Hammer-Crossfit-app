import React, { useState, useEffect } from 'react';
import './MemberDashboard.css';
import {
  generateQRCodeData,
  generateQRCodeImage,
  storeQRCode,
  getUserQRCode,
  QRCodeData,
} from '../services/qrCodeService';

interface UserProfile {
  name: string;
  membershipType: string;
  joinDate: string;
  visitsThisMonth: number;
  totalVisits: number;
  avatar?: string;
}

interface ClassBooking {
  id: string;
  className: string;
  instructor: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'warning' | 'success';
}

interface MemberDashboardProps {
  onNavigate?: (page: string) => void;
  user?: {
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
  } | null;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ onNavigate, user }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user ? `${user.firstName} ${user.lastName}` : 'Viking Warrior',
    membershipType: user?.membershipType || 'Viking Warrior Basic',
    joinDate: user?.joinDate || new Date().toISOString(),
    visitsThisMonth: 12,
    totalVisits: 158,
  });

  // Update user profile when user data changes
  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`,
        membershipType: user.membershipType,
        joinDate: user.joinDate,
      }));
    }
  }, [user]);

  const [upcomingClasses, setUpcomingClasses] = useState<ClassBooking[]>([
    {
      id: '1',
      className: 'CrossFit WOD',
      instructor: 'Thor Hansen',
      date: '2025-10-07',
      time: '06:00',
      status: 'upcoming',
    },
    {
      id: '2',
      className: 'Strength Training',
      instructor: 'Freya Nielsen',
      date: '2025-10-07',
      time: '18:00',
      status: 'upcoming',
    },
    {
      id: '3',
      className: 'HIIT Cardio',
      instructor: 'Erik Larsen',
      date: '2025-10-08',
      time: '07:00',
      status: 'upcoming',
    },
  ]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'New Equipment Arrival',
      message: 'Check out our new Rogue fitness equipment in the main training area!',
      date: '2025-10-05',
      type: 'success',
    },
    {
      id: '2',
      title: 'Holiday Schedule',
      message: 'Modified hours during the upcoming holiday weekend.',
      date: '2025-10-04',
      type: 'info',
    },
  ]);

  const [quickStats, setQuickStats] = useState({
    nextClass: 'CrossFit WOD - Tomorrow 6:00 AM',
    membershipExpiry: '2025-11-15',
    qrCode: 'VH-JV-2024-001',
  });

  // QR Code state management
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [qrCodeImage, setQRCodeImage] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const handleBookClass = () => {
    // Navigate to class booking page
    console.log('Navigate to class booking');
  };

  const handleViewProfile = () => {
    // Navigate to profile page
    if (onNavigate) {
      onNavigate('profile');
    } else {
      console.log('Navigate to profile');
    }
  };

  // QR Code generation function
  const generateNewQRCode = async () => {
    if (!user) return;

    try {
      setIsGeneratingQR(true);

      // Generate new QR code data
      const newQRData = generateQRCodeData(
        user.id || user.email, // Use ID or email as userId
        user.email,
        user.membershipType || 'Viking Warrior Basic',
      );

      // Generate QR code image
      const qrImage = await generateQRCodeImage(newQRData);

      // Store in localStorage for demo mode
      storeQRCode(user.id || user.email, newQRData);

      // Update state
      setQRCodeData(newQRData);
      setQRCodeImage(qrImage);

      // Update quickStats to show new QR ID
      setQuickStats((prev) => ({
        ...prev,
        qrCode: newQRData.checkInId,
      }));

      console.log('New QR code generated:', newQRData.checkInId);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Load existing QR code or generate new one
  const loadOrGenerateQRCode = async () => {
    if (!user) return;

    const userId = user.id || user.email;
    const existingQR = getUserQRCode(userId);

    if (existingQR) {
      // Use existing valid QR code
      try {
        const qrImage = await generateQRCodeImage(existingQR);
        setQRCodeData(existingQR);
        setQRCodeImage(qrImage);
        setQuickStats((prev) => ({
          ...prev,
          qrCode: existingQR.checkInId,
        }));
        console.log('Loaded existing QR code:', existingQR.checkInId);
      } catch (error) {
        console.error('Failed to regenerate QR image:', error);
        // Generate new QR if image generation fails
        generateNewQRCode();
      }
    } else {
      // Generate new QR code
      generateNewQRCode();
    }
  };

  // Auto-generate QR code when user changes
  useEffect(() => {
    if (user) {
      loadOrGenerateQRCode();
    }
  }, [user]);

  const handleGenerateQR = () => {
    // Show QR modal and generate/load QR code
    setShowQRModal(true);
    if (!qrCodeData) {
      loadOrGenerateQRCode();
    }
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
  };

  const handleRegenerateQR = () => {
    // Generate new QR code for check-in
    generateNewQRCode();
  };

  return (
    <div className="member-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="user-welcome">
          <div className="user-avatar">
            <img src="/api/placeholder/60/60" alt="User Avatar" />
          </div>
          <div className="welcome-text">
            <h1>Welcome back, {userProfile.name}!</h1>
            <p className="membership-info">
              {userProfile.membershipType} • Member since{' '}
              {new Date(userProfile.joinDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={handleGenerateQR}>
            <span className="icon">📱</span>
            Check-In QR Code
          </button>
          <button className="btn btn-secondary" onClick={handleBookClass}>
            <span className="icon">📅</span>
            Book Class
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏃‍♂️</div>
          <div className="stat-content">
            <h3>{userProfile.visitsThisMonth}</h3>
            <p>Visits This Month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💪</div>
          <div className="stat-content">
            <h3>{userProfile.totalVisits}</h3>
            <p>Total Visits</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{upcomingClasses.length}</h3>
            <p>Upcoming Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Active</h3>
            <p>Membership Status</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Upcoming Classes */}
        <div className="content-section">
          <div className="section-header">
            <h2>🗓️ Upcoming Classes</h2>
            <button className="btn btn-link" onClick={handleBookClass}>
              View All
            </button>
          </div>
          <div className="classes-list">
            {upcomingClasses.map((classItem) => (
              <div key={classItem.id} className="class-card">
                <div className="class-info">
                  <h4>{classItem.className}</h4>
                  <p className="instructor">with {classItem.instructor}</p>
                  <div className="class-datetime">
                    <span className="date">{new Date(classItem.date).toLocaleDateString()}</span>
                    <span className="time">{classItem.time}</span>
                  </div>
                </div>
                <div className="class-actions">
                  <button className="btn btn-outline">Cancel</button>
                  <button className="btn btn-primary">Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access Menu */}
        <div className="content-section">
          <div className="section-header">
            <h2>⚡ Quick Access</h2>
          </div>
          <div className="quick-menu">
            <div className="menu-item" onClick={handleViewProfile}>
              <div className="menu-icon">👤</div>
              <div className="menu-content">
                <h4>My Profile</h4>
                <p>View and edit personal information</p>
              </div>
            </div>
            <div className="menu-item">
              <div className="menu-icon">💳</div>
              <div className="menu-content">
                <h4>My Subscription</h4>
                <p>Manage membership and billing</p>
              </div>
            </div>
            <div className="menu-item">
              <div className="menu-icon">📊</div>
              <div className="menu-content">
                <h4>Progress Tracking</h4>
                <p>View workout history and stats</p>
              </div>
            </div>
            <div className="menu-item">
              <div className="menu-icon">⚙️</div>
              <div className="menu-content">
                <h4>Settings</h4>
                <p>App preferences and notifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gym Announcements */}
        <div className="content-section full-width">
          <div className="section-header">
            <h2>📢 Gym News & Announcements</h2>
          </div>
          <div className="announcements-list">
            {announcements.map((announcement) => (
              <div key={announcement.id} className={`announcement-card ${announcement.type}`}>
                <div className="announcement-header">
                  <h4>{announcement.title}</h4>
                  <span className="announcement-date">
                    {new Date(announcement.date).toLocaleDateString()}
                  </span>
                </div>
                <p>{announcement.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="qr-modal-overlay" onClick={handleCloseQRModal}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>🎫 Your Check-In QR Code</h3>
              <button className="close-button" onClick={handleCloseQRModal}>
                ✕
              </button>
            </div>
            <div className="qr-modal-content">
              <div className="qr-display">
                {qrCodeImage ? (
                  <img
                    src={qrCodeImage}
                    alt="Check-in QR Code"
                    className="qr-code-image"
                  />
                ) : (
                  <div className="qr-loading">
                    {isGeneratingQR ? (
                      <div className="loading-content">
                        <div className="spinner">🔄</div>
                        <p>Generating QR Code...</p>
                      </div>
                    ) : (
                      <div className="qr-pattern"></div>
                    )}
                  </div>
                )}
              </div>
              <div className="qr-info">
                <p className="qr-instruction">Present this QR code to the receptionist to check in</p>
                <p className="qr-id">ID: {quickStats.qrCode}</p>
                {qrCodeData && (
                  <div className="qr-details">
                    <p>Expires: {new Date(qrCodeData.expiresAt).toLocaleDateString()}</p>
                    <p>Generated: {new Date(qrCodeData.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="qr-actions">
                <button
                  onClick={handleRegenerateQR}
                  disabled={isGeneratingQR}
                  className="btn btn-secondary"
                >
                  {isGeneratingQR ? 'Generating...' : 'Generate New QR'}
                </button>
                <button onClick={handleCloseQRModal} className="btn btn-primary">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;
