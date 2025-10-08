import React from 'react';
import './MyProfile.css';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  countryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactCountryCode?: string;
  membershipType: string;
  joinDate: string;
}

interface MyProfileProps {
  user?: User | null;
  onNavigate?: (page: string) => void;
}

const MyProfile: React.FC<MyProfileProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = React.useState('personal');

  return (
    <div className="my-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.firstName?.[0]?.toUpperCase() || 'V'}
          {user?.lastName?.[0]?.toUpperCase() || 'W'}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : 'Viking Warrior'}
          </h1>
          <p className="profile-membership">{user?.membershipType || 'Viking Warrior Basic'}</p>
        </div>
        <div className="profile-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate?.('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          onClick={() => setActiveTab('personal')} 
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
        >
          Personal Info
        </button>
        <button 
          onClick={() => setActiveTab('membership')} 
          className={`tab ${activeTab === 'membership' ? 'active' : ''}`}
        >
          Membership
        </button>
        <button 
          onClick={() => setActiveTab('emergency')} 
          className={`tab ${activeTab === 'emergency' ? 'active' : ''}`}
        >
          Emergency Contact
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'personal' && (
          <div className="profile-section">
            <div className="section-header">
              <h3>Personal Information</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" className="form-input" value={user?.firstName || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" className="form-input" value={user?.lastName || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-input" value={user?.email || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" className="form-input" value={`${user?.countryCode || ''} ${user?.phone || ''}`} readOnly />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="text" className="form-input" value={user?.dateOfBirth || 'Not provided'} readOnly />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <input type="text" className="form-input" value={user?.gender || 'Not provided'} readOnly />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'membership' && (
          <div className="profile-section">
            <div className="section-header">
              <h3>Membership Details</h3>
            </div>
            <div className="membership-card">
              <div className="form-grid">
                <div className="form-group">
                  <label>Membership Type</label>
                  <div className="detail-item">
                    <span className="value">{user?.membershipType || 'Viking Warrior Basic'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Join Date</label>
                  <div className="detail-item">
                    <span className="value">{user?.joinDate || 'January 2024'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <div className="detail-item">
                    <span className="value">Active</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Next Payment</label>
                  <div className="detail-item">
                    <span className="value">January 15, 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="profile-section">
            <div className="section-header">
              <h3>Emergency Contact</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Contact Name</label>
                <input type="text" className="form-input" value={user?.emergencyContactName || 'Not provided'} readOnly />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input type="text" className="form-input" value={`${user?.emergencyContactCountryCode || ''} ${user?.emergencyContactPhone || 'Not provided'}`} readOnly />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
