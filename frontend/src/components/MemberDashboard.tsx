import React, { useState, useEffect } from 'react';
import './MemberDashboard.css';

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

const MemberDashboard: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Viking',
    membershipType: 'Premium Monthly',
    joinDate: '2024-01-15',
    visitsThisMonth: 12,
    totalVisits: 158,
  });

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

  const handleBookClass = () => {
    // Navigate to class booking page
    console.log('Navigate to class booking');
  };

  const handleViewProfile = () => {
    // Navigate to profile page
    console.log('Navigate to profile');
  };

  const handleGenerateQR = () => {
    // Generate new QR code for check-in
    console.log('Generate QR code');
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
            Check-In QR
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

      {/* QR Code Section */}
      <div className="qr-section">
        <div className="qr-card">
          <h3>🎫 Your Check-In QR Code</h3>
          <div className="qr-placeholder">
            <div className="qr-code">
              {/* QR Code would be generated here */}
              <div className="qr-pattern"></div>
            </div>
            <p>Scan at reception to check in</p>
            <p className="qr-id">ID: {quickStats.qrCode}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
