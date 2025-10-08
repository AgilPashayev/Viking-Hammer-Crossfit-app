import React, { useState } from 'react';
import QRScanner from './QRScanner';
import MemberManagement from './MemberManagement';
import CheckInHistory from './CheckInHistory';
import ClassManagement from './ClassManagement';
import AnnouncementManager from './AnnouncementManager';
import MembershipManager from './MembershipManager';
import UpcomingBirthdays from './UpcomingBirthdays';
import './Reception.css';

interface ReceptionProps {
  onNavigate?: (page: string) => void;
}

const Reception: React.FC<ReceptionProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({
    totalMembers: 245,
    checkedInToday: 48,
    instructors: 12,
    activeClasses: 8,
    expiringMemberships: 7,
    upcomingBirthdays: 3
  });

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'qr-scanner':
        return <QRScanner onBack={() => setActiveSection('dashboard')} />;
      case 'members':
        return <MemberManagement onBack={() => setActiveSection('dashboard')} />;
      case 'checkins':
        return <CheckInHistory onBack={() => setActiveSection('dashboard')} />;
      case 'classes':
        return <ClassManagement onBack={() => setActiveSection('dashboard')} />;
      case 'announcements':
        return <AnnouncementManager onBack={() => setActiveSection('dashboard')} />;
      case 'memberships':
        return <MembershipManager onBack={() => setActiveSection('dashboard')} />;
      case 'birthdays':
        return <UpcomingBirthdays onBack={() => setActiveSection('dashboard')} />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="reception-dashboard">
      <div className="dashboard-header">
        <div className="reception-welcome">
          <div className="reception-avatar">
            <span>R</span>
          </div>
          <div className="welcome-text">
            <h1>Reception Dashboard</h1>
            <p>Manage your gym operations efficiently</p>
          </div>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={() => setActiveSection('qr-scanner')}>
            📱 Scan QR
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate?.('dashboard')}>
            🏠 Member View
          </button>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card primary clickable" onClick={() => setActiveSection('members')}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalMembers}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="stat-card success clickable" onClick={() => setActiveSection('checkins')}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.checkedInToday}</h3>
            <p>Checked In Today</p>
          </div>
        </div>
        <div className="stat-card info clickable" onClick={() => setActiveSection('classes')}>
          <div className="stat-icon">🏋️</div>
          <div className="stat-content">
            <h3>{stats.instructors}</h3>
            <p>Instructors</p>
          </div>
        </div>
        <div className="stat-card warning clickable" onClick={() => setActiveSection('classes')}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.activeClasses}</h3>
            <p>Active Classes</p>
          </div>
        </div>
        <div className="stat-card danger clickable" onClick={() => setActiveSection('memberships')}>
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.expiringMemberships}</h3>
            <p>Expiring Soon (7 days)</p>
          </div>
        </div>
        <div className="stat-card birthday clickable" onClick={() => setActiveSection('birthdays')}>
          <div className="stat-icon">🎂</div>
          <div className="stat-content">
            <h3>{stats.upcomingBirthdays}</h3>
            <p>Upcoming Birthdays</p>
          </div>
        </div>
      </div>

      <div className="management-sections">
        <div className="section-grid">
          <div className="management-card" onClick={() => setActiveSection('members')}>
            <div className="card-icon">👥</div>
            <h3>Member Management</h3>
            <p>Add, update, and manage member profiles</p>
            <div className="card-badge">245 Members</div>
          </div>

          <div className="management-card" onClick={() => setActiveSection('checkins')}>
            <div className="card-icon">📊</div>
            <h3>Check-In History</h3>
            <p>View and analyze member check-in data</p>
            <div className="card-badge">48 Today</div>
          </div>

          <div className="management-card" onClick={() => setActiveSection('classes')}>
            <div className="card-icon">🏋️‍♂️</div>
            <h3>Class Management</h3>
            <p>Assign instructors and manage class schedules</p>
            <div className="card-badge">8 Active</div>
          </div>

          <div className="management-card" onClick={() => setActiveSection('announcements')}>
            <div className="card-icon">📢</div>
            <h3>Announcements</h3>
            <p>Send notifications to all members</p>
            <div className="card-badge">New</div>
          </div>

          <div className="management-card" onClick={() => setActiveSection('memberships')}>
            <div className="card-icon">💎</div>
            <h3>Membership Plans</h3>
            <p>Manage subscription plans and pricing</p>
            <div className="card-badge">3 Plans</div>
          </div>

          <div className="management-card" onClick={() => setActiveSection('birthdays')}>
            <div className="card-icon">🎉</div>
            <h3>Upcoming Birthdays</h3>
            <p>Keep members happy with birthday wishes</p>
            <div className="card-badge">{stats.upcomingBirthdays} This Week</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon success">✅</div>
            <div className="activity-content">
              <p><strong>John Viking</strong> checked in</p>
              <span>2 minutes ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon info">👤</div>
            <div className="activity-content">
              <p>New member <strong>Sarah Connor</strong> registered</p>
              <span>15 minutes ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon warning">💳</div>
            <div className="activity-content">
              <p><strong>Mike Johnson</strong> payment due tomorrow</p>
              <span>1 hour ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon birthday">🎂</div>
            <div className="activity-content">
              <p><strong>Emma Wilson</strong> birthday tomorrow</p>
              <span>2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reception">
      {renderActiveSection()}
    </div>
  );
};

export default Reception;