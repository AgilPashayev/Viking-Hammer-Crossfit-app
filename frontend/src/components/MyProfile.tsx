import React, { useState, useRef, useEffect } from 'react';
import './MyProfile.css';
import './MyProfile-enhancements.css';
import { uploadProfilePhoto, updateUserProfile, getUserProfile } from '../services/supabaseService';
import { getUserMembershipHistory, MembershipRecord } from '../services/membershipHistoryService';

interface User {
  id?: string;
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
  role?: 'member' | 'admin' | 'reception' | 'sparta' | 'instructor';
  profilePhoto?: string;
  avatar_url?: string;
}

interface MyProfileProps {
  user?: User | null;
  onNavigate?: (page: string) => void;
  currentUserRole?: 'member' | 'admin' | 'reception' | 'sparta' | 'instructor';
  onUserUpdate?: (updatedUser: User) => void;
}

const MyProfile: React.FC<MyProfileProps> = ({ user, onNavigate, currentUserRole = 'member', onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || user?.avatar_url || '');
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [membershipHistory, setMembershipHistory] = useState<MembershipRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showPhotoSuccessModal, setShowPhotoSuccessModal] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({
    name: user?.emergencyContactName || '',
    phone: user?.emergencyContactPhone || '',
    countryCode: user?.emergencyContactCountryCode || '+994'
  });
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    theme: 'light',
    language: 'en'
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load user settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        try {
          setIsLoadingSettings(true);
          const response = await fetch(`http://localhost:4001/api/settings/user/${user.id}`);
          const result = await response.json();

          if (result.success && result.data) {
            setSettings({
              notifications: result.data.email_notifications ?? true,
              emailAlerts: result.data.email_notifications ?? true,
              smsAlerts: result.data.sms_notifications ?? false,
              pushNotifications: result.data.push_notifications ?? true,
              theme: result.data.theme || 'light',
              language: result.data.language || 'en',
            });
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
          // Use default settings on error
        } finally {
          setIsLoadingSettings(false);
        }
      }
    };

    loadSettings();
  }, [user?.id]);
  
  // Load profile photo from user data on mount or user change
  useEffect(() => {
    if (user?.avatar_url || user?.profilePhoto) {
      setProfilePhoto(user.avatar_url || user.profilePhoto || '');
    }
  }, [user]);

  // Load membership history when modal opens
  useEffect(() => {
    const loadMembershipHistory = async () => {
      if (showHistoryModal && user?.id) {
        setIsLoadingHistory(true);
        setHistoryError(null);

        const result = await getUserMembershipHistory(user.id);

        if (result.success && result.data) {
          setMembershipHistory(result.data);
          console.log('✅ Membership history loaded:', result.data.length, 'records');
        } else {
          const friendlyError = result.error?.includes('fetch') 
            ? 'Unable to connect to the server. Please check your internet connection and try again.'
            : result.error || 'Unable to load membership history. Please try again later.';
          setHistoryError(friendlyError);
          console.error('❌ Membership history error:', result.error);
        }

        setIsLoadingHistory(false);
      }
    };

    loadMembershipHistory();
  }, [showHistoryModal, user?.id]);
  
  // Check if current user can edit names
  const canEditNames = currentUserRole === 'admin' || currentUserRole === 'reception' || currentUserRole === 'sparta';
  
  // Format date to readable format (e.g., "January 15, 2025")
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('❌ Please upload an image file');
        return;
      }
      
      // Show loading state
      console.log('📸 Uploading photo...');
      
      try {
        // Upload to Supabase storage
        const { url, error } = await uploadProfilePhoto(user?.id || '', file);
        
        if (error) {
          alert(`❌ Failed to upload photo: ${error}`);
          return;
        }
        
        if (url) {
          // Update local state
          setProfilePhoto(url);
          
          // Update user profile in database
          const { user: updatedUser, error: updateError } = await updateUserProfile(user?.id || '', {
            profilePhoto: url,
            avatar_url: url
          });
          
          if (updateError) {
            console.error('Failed to update profile:', updateError);
            alert('❌ Photo uploaded but failed to update profile');
            return;
          }
          
          // Notify parent component of user update
          if (onUserUpdate && updatedUser) {
            onUserUpdate(updatedUser as User);
          }
          
          console.log('✅ Profile photo updated successfully!');
          // Show user-friendly success modal
          setShowPhotoSuccessModal(true);
        }
      } catch (error) {
        console.error('Photo upload error:', error);
        alert('❌ An unexpected error occurred');
      }
    }
  };
  
  const handleSaveEmergencyContact = () => {
    // TODO: Save to database via API
    console.log('💾 Saving emergency contact:', emergencyContact);
    alert('✅ Emergency contact updated successfully!');
    setIsEditingEmergency(false);
  };
  
  const handleSaveSettings = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:4001/api/settings/user/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications: settings.emailAlerts,
          smsNotifications: settings.smsAlerts,
          pushNotifications: settings.pushNotifications,
          language: settings.language,
          theme: settings.theme,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('⚙️ Settings saved successfully:', result.data);
        alert('✅ Settings saved successfully!');
        setIsEditingSettings(false);
      } else {
        alert('❌ Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Failed to save settings. Please check your connection.');
    }
  };
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, pushNotifications: true }));
        alert('✅ Notifications enabled successfully!');
      } else {
        alert('❌ Notification permission denied');
      }
    } else {
      alert('❌ Notifications not supported in this browser');
    }
  };

  return (
    <div className="my-profile">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar" onClick={() => fileInputRef.current?.click()}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="avatar-image" />
            ) : (
              <>
                {user?.firstName?.[0]?.toUpperCase() || 'V'}
                {user?.lastName?.[0]?.toUpperCase() || 'W'}
              </>
            )}
            <div className="avatar-overlay">
              <span>📷</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
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
            ⬅️ Back to Dashboard
          </button>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          onClick={() => setActiveTab('personal')} 
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
        >
          👤 Personal Info
        </button>
        <button 
          onClick={() => setActiveTab('subscription')} 
          className={`tab ${activeTab === 'subscription' ? 'active' : ''}`}
        >
          💳 My Subscription
        </button>
        <button 
          onClick={() => setActiveTab('emergency')} 
          className={`tab ${activeTab === 'emergency' ? 'active' : ''}`}
        >
          🚨 Emergency Contact
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'personal' && (
          <div className="profile-section">
            <div className="section-header">
              <h3>📋 Personal Information</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={user?.firstName || ''} 
                  readOnly={!canEditNames}
                  disabled={!canEditNames}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={user?.lastName || ''} 
                  readOnly={!canEditNames}
                  disabled={!canEditNames}
                />
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

        {activeTab === 'subscription' && (
          <div className="profile-section">
            <div className="section-header">
              <h3>💎 My Subscription</h3>
              <p className="section-description">Manage your membership and view subscription details</p>
            </div>
            <div className="subscription-card">
              <div className="subscription-badge active">Active Membership</div>
              <div className="subscription-details">
                <div className="detail-row">
                  <span className="detail-icon">🎯</span>
                  <div className="detail-content">
                    <span className="detail-label">Membership Type</span>
                    <span className="detail-value subscription-value">{user?.membershipType || 'Viking Warrior Basic'}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">📅</span>
                  <div className="detail-content">
                    <span className="detail-label">Join Date</span>
                    <span className="detail-value subscription-value">{formatDate(user?.joinDate || new Date().toISOString())}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">✅</span>
                  <div className="detail-content">
                    <span className="detail-label">Status</span>
                    <span className="detail-value status-active">Active</span>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">💰</span>
                  <div className="detail-content">
                    <span className="detail-label">Next Payment</span>
                    <span className="detail-value subscription-value">January 15, 2025</span>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">🏋️</span>
                  <div className="detail-content">
                    <span className="detail-label">Remaining Entries</span>
                    <span className="detail-value subscription-value">Unlimited</span>
                  </div>
                </div>
              </div>
              <div className="subscription-actions">
                <button className="btn btn-primary" onClick={() => setShowHistoryModal(true)}>
                  📊 View History
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="profile-section">
            <div className="section-header">
              <h3>🚨 Emergency Contact</h3>
              <p className="section-description">Update your emergency contact information (optional)</p>
              {!isEditingEmergency && (
                <button className="btn btn-primary btn-sm" onClick={() => setIsEditingEmergency(true)}>
                  ✏️ Edit
                </button>
              )}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Contact Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={isEditingEmergency ? emergencyContact.name : (user?.emergencyContactName || 'Not provided')}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                  readOnly={!isEditingEmergency}
                  disabled={!isEditingEmergency}
                  placeholder="Enter contact name"
                />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <div className="phone-input-group">
                  <select 
                    className="country-code-select"
                    value={emergencyContact.countryCode}
                    onChange={(e) => setEmergencyContact(prev => ({ ...prev, countryCode: e.target.value }))}
                    disabled={!isEditingEmergency}
                  >
                    <option value="+994">🇦🇿 +994</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                  </select>
                  <input 
                    type="text" 
                    className="form-input phone-input" 
                    value={isEditingEmergency ? emergencyContact.phone : (user?.emergencyContactPhone || 'Not provided')}
                    onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                    readOnly={!isEditingEmergency}
                    disabled={!isEditingEmergency}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
            {isEditingEmergency && (
              <div className="action-buttons">
                <button className="btn btn-success" onClick={handleSaveEmergencyContact}>
                  ✅ Save Changes
                </button>
                <button className="btn btn-secondary" onClick={() => setIsEditingEmergency(false)}>
                  ❌ Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="profile-section">
            <div className="section-header">
              <h3>⚙️ Settings & Preferences</h3>
              <p className="section-description">Manage your app settings and notifications</p>
            </div>
            
            <div className="settings-group">
              <h4>🔔 Notification Preferences</h4>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Push Notifications</span>
                    <span className="setting-description">Receive push notifications on your device</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.pushNotifications}
                      onChange={(e) => {
                        if (e.target.checked) {
                          requestNotificationPermission();
                        } else {
                          setSettings(prev => ({ ...prev, pushNotifications: false }));
                        }
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Email Alerts</span>
                    <span className="setting-description">Receive notifications via email</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.emailAlerts}
                      onChange={(e) => setSettings(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">SMS Alerts</span>
                    <span className="setting-description">Receive important updates via SMS</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.smsAlerts}
                      onChange={(e) => setSettings(prev => ({ ...prev, smsAlerts: e.target.checked }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="settings-group">
              <h4>🎨 Appearance</h4>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Theme</span>
                    <span className="setting-description">Choose your preferred theme</span>
                  </div>
                  <select 
                    className="form-select"
                    value={settings.theme}
                    onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                  >
                    <option value="light">☀️ Light</option>
                    <option value="dark">🌙 Dark</option>
                    <option value="auto">🔄 Auto</option>
                  </select>
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Language</span>
                    <span className="setting-description">Select your preferred language</span>
                  </div>
                  <select 
                    className="form-select"
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="az">🇦🇿 Azərbaycanca</option>
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="tr">🇹🇷 Türkçe</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="btn btn-success" onClick={handleSaveSettings}>
                ✅ Save Settings
              </button>
              <button className="btn btn-secondary" onClick={() => {
                // Reset to defaults
                setSettings({
                  notifications: true,
                  emailAlerts: true,
                  smsAlerts: false,
                  pushNotifications: true,
                  theme: 'light',
                  language: 'en'
                });
              }}>
                🔄 Reset to Defaults
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Membership History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Membership History</h2>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {isLoadingHistory ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading membership history...</p>
                </div>
              ) : historyError ? (
                <div className="error-container">
                  <span className="error-icon">⚠️</span>
                  <p>{historyError}</p>
                  <button className="btn btn-primary" onClick={() => setShowHistoryModal(false)}>
                    Close
                  </button>
                </div>
              ) : membershipHistory.length === 0 ? (
                <div className="empty-container">
                  <span className="empty-icon">📋</span>
                  <h3>No Membership History</h3>
                  <p>You don't have any membership records yet.</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {membershipHistory.map((record) => (
                    <div key={record.id} className={`history-card ${record.status}`}>
                      <div className="history-header">
                        <div className="plan-info">
                          <h3>{record.plan_name}</h3>
                          <span className="plan-type">{record.plan_type.toUpperCase()}</span>
                        </div>
                        <span className={`status-badge ${record.status}`}>
                          {record.status === 'active' && '✅ Active'}
                          {record.status === 'expired' && '⏰ Expired'}
                          {record.status === 'completed' && '✔️ Completed'}
                          {record.status === 'cancelled' && '❌ Cancelled'}
                          {record.status === 'pending' && '⏳ Pending'}
                        </span>
                      </div>
                      
                      <div className="history-grid">
                        {/* Date Information */}
                        <div className="info-group">
                          <div className="info-item">
                            <span className="info-icon">📅</span>
                            <div className="info-content">
                              <span className="info-label">Start Date</span>
                              <span className="info-value">
                                {new Date(record.start_date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                          
                          {record.end_date ? (
                            <div className="info-item">
                              <span className="info-icon">📅</span>
                              <div className="info-content">
                                <span className="info-label">End Date</span>
                                <span className="info-value">
                                  {new Date(record.end_date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="info-item">
                              <span className="info-icon">∞</span>
                              <div className="info-content">
                                <span className="info-label">Duration</span>
                                <span className="info-value ongoing">Ongoing</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Financial Information */}
                        <div className="info-group">
                          <div className="info-item">
                            <span className="info-icon">💰</span>
                            <div className="info-content">
                              <span className="info-label">Amount</span>
                              <span className="info-value amount">
                                {record.amount > 0 
                                  ? `${record.currency} ${record.amount.toFixed(2)}`
                                  : 'Free'
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-icon">💳</span>
                            <div className="info-content">
                              <span className="info-label">Payment Method</span>
                              <span className="info-value">
                                {record.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Membership Details */}
                        <div className="info-group">
                          <div className="info-item">
                            <span className="info-icon">🔄</span>
                            <div className="info-content">
                              <span className="info-label">Renewal Type</span>
                              <span className="info-value">
                                {record.renewal_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                {record.auto_renew && ' 🔁'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-icon">🏋️</span>
                            <div className="info-content">
                              <span className="info-label">Class Access</span>
                              <span className="info-value">
                                {record.class_limit ? `${record.class_limit} per month` : 'Unlimited'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Information */}
                        {record.next_billing_date && record.status === 'active' && (
                          <div className="info-group highlight">
                            <div className="info-item">
                              <span className="info-icon">📆</span>
                              <div className="info-content">
                                <span className="info-label">Next Billing Date</span>
                                <span className="info-value next-billing">
                                  {new Date(record.next_billing_date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {record.cancellation_reason && (
                          <div className="info-group warning">
                            <div className="info-item full-width">
                              <span className="info-icon">ℹ️</span>
                              <div className="info-content">
                                <span className="info-label">Cancellation Reason</span>
                                <span className="info-value">{record.cancellation_reason}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Success Modal */}
      {showPhotoSuccessModal && (
        <div className="modal-overlay success-modal-overlay" onClick={() => setShowPhotoSuccessModal(false)}>
          <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-wrapper">
              <div className="success-checkmark">
                <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                  <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
            </div>
            <div className="success-content">
              <h3 className="success-title">Profile Photo Updated!</h3>
              <p className="success-message">
                Your new photo is now visible to all members
              </p>
            </div>
            <div className="success-actions">
              <button 
                className="btn btn-primary success-btn" 
                onClick={() => setShowPhotoSuccessModal(false)}
              >
                Great!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
