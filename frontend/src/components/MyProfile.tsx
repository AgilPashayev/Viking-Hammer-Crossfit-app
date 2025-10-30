﻿import React, { useState, useRef, useEffect } from 'react';
import './MyProfile.css';
import './MyProfile-enhancements.css';
import './MyProfile-notifications.css';
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
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    countryCode: user?.countryCode || '+994',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || ''
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [membershipHistory, setMembershipHistory] = useState<MembershipRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showPhotoSuccessModal, setShowPhotoSuccessModal] = useState(false);
  
  // Custom notification modal state
  const [notificationModal, setNotificationModal] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    autoClose?: boolean;
  }>({
    show: false,
    type: 'info',
    title: '',
    message: '',
    autoClose: true
  });
  
  // Subscription state
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  
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
  
  // Update personal info when user changes
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        email: user.email || '',
        phone: user.phone || '',
        countryCode: user.countryCode || '+994',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || ''
      });
    }
  }, [user]);

  // Load subscription data when subscription tab is active
  useEffect(() => {
    const loadSubscription = async () => {
      if (activeTab === 'subscription' && user?.id) {
        setIsLoadingSubscription(true);
        try {
          console.log('💳 Loading subscription data for user:', user.id);
          const token = localStorage.getItem('authToken') || localStorage.getItem('token');
          
          const response = await fetch(`http://localhost:4001/api/subscriptions/user/${user.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.error('❌ Failed to load subscription:', response.status);
            setSubscription(null);
            return;
          }
          
          const result = await response.json();
          console.log('📊 Subscription response:', result);
          
          if (result.success && result.data && result.data.length > 0) {
            // Find active subscription or use the most recent one
            const activeSub = result.data.find((s: any) => s.status === 'active') || result.data[0];
            console.log('✅ Active subscription found:', activeSub);
            setSubscription(activeSub);
          } else {
            console.log('ℹ️ No subscription found for user');
            setSubscription(null);
          }
        } catch (error) {
          console.error('❌ Failed to load subscription:', error);
          setSubscription(null);
        } finally {
          setIsLoadingSubscription(false);
        }
      }
    };

    loadSubscription();
  }, [activeTab, user?.id]);

    // Load membership history when modal opens
  useEffect(() => {
    const loadMembershipHistory = async () => {
      if (showHistoryModal && user?.id) {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          console.log('📊 Loading membership history for user:', user.id);
          const result = await getUserMembershipHistory(user.id);
          
          if (result.success && result.data) {
            setMembershipHistory(result.data);
            console.log('✅ Membership history loaded:', result.data.length, 'records');
          } else {
            // User-friendly message for new members
            const errorMsg = result.data && result.data.length === 0
              ? '👋 Welcome! Your membership history will appear here once you start using our services.'
              : result.error || 'Unable to load membership history. Please try again later.';
            setHistoryError(errorMsg);
            console.error('❌ Membership history error:', result.error);
          }
        } catch (error) {
          console.error('❌ Failed to load membership history:', error);
          setHistoryError('⚠️ Unable to connect to the server. Please check your connection and try again.');
        } finally {
          setIsLoadingHistory(false);
        }
      }
    };

    loadMembershipHistory();
  }, [showHistoryModal, user?.id]);
  
  // Check if current user can edit names
  const canEditNames = currentUserRole === 'admin' || currentUserRole === 'reception' || currentUserRole === 'sparta';
  
  // Helper function to show user-friendly notification modals
  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info', 
    title: string, 
    message: string,
    autoClose: boolean = true
  ) => {
    setNotificationModal({
      show: true,
      type,
      title,
      message,
      autoClose
    });
    
    // Auto-close success notifications after 5 seconds
    if (autoClose && type === 'success') {
      setTimeout(() => {
        closeNotification();
      }, 5000);
    }
  };
  
  const closeNotification = () => {
    setNotificationModal({ show: false, type: 'info', title: '', message: '', autoClose: true });
  };
  
  // Format date to readable format (e.g., "Oct 15, 2025")
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!user?.id) {
      showNotification('error', 'Not Logged In', 'User session expired. Please refresh the page and login again.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'File Too Large', 'Please select an image smaller than 5MB.');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Invalid File Type', 'Please select an image file (JPG, PNG, GIF, etc.).');
      return;
    }
    
    try {
      console.log('📸 Starting photo upload...');
      
      // Get auth token (try both possible token storage keys)
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication Required', 'Please login again to upload your profile photo.');
        console.error('❌ No auth token found in localStorage');
        return;
      }
      console.log('🔑 Auth token found:', token.substring(0, 20) + '...');
      
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          console.log('📦 Image converted to base64, uploading to backend...');
          
          // Upload via backend API endpoint
          const response = await fetch(`http://localhost:4001/api/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              photo_base64: base64Data,
              photo_filename: file.name
            })
          });
          
          console.log('📥 Response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
            console.error('❌ Server error:', errorData);
            throw new Error(errorData.error || 'Upload failed');
          }
          
          const result = await response.json();
          console.log('✅ Photo uploaded successfully:', result);
          
          if (result.success && result.user && result.user.avatar_url) {
            // Update local state immediately
            setProfilePhoto(result.user.avatar_url);
            
            // Fetch fresh user data from backend to ensure consistency
            try {
              const token = localStorage.getItem('authToken') || localStorage.getItem('token');
              if (token) {
                const userResponse = await fetch('http://localhost:4001/api/users/me', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (userResponse.ok) {
                  const freshUserData = await userResponse.json();
                  console.log('✅ Fetched fresh user data:', freshUserData);
                  
                  // Update parent component with complete fresh data
                  if (onUserUpdate) {
                    onUserUpdate(freshUserData);
                  }
                }
              }
            } catch (fetchError) {
              console.warn('⚠️ Could not fetch fresh user data:', fetchError);
              // Fall back to updating with result data
              if (onUserUpdate && user) {
                onUserUpdate({
                  ...user,
                  profilePhoto: result.user.avatar_url,
                  avatar_url: result.user.avatar_url
                });
              }
            }
            
            showNotification('success', 'Photo Updated!', 'Your profile photo has been updated successfully.');
          } else {
            showNotification('warning', 'Upload Complete', 'Photo was saved but preview unavailable. Please refresh the page.');
          }
        } catch (uploadError: any) {
          console.error('❌ Upload error:', uploadError);
          const errorMsg = uploadError.message || '';
          if (errorMsg.includes('Storage configuration') || errorMsg.includes('Bucket not found')) {
            showNotification('error', 'Storage Setup Required', 
              'The photo storage bucket needs to be created in Supabase. Please check the CREATE_STORAGE_BUCKET.md file in your project folder for 5-minute setup instructions.', false);
          } else {
            showNotification('error', 'Upload Failed', 
              uploadError.message || 'Failed to upload photo. Please try again or contact support if the problem persists.', false);
          }
        }
      };
      
      reader.onerror = () => {
        console.error('❌ File reading error');
        showNotification('error', 'File Read Error', 'Unable to read the selected file. Please try a different image.');
      };
    } catch (error: any) {
      console.error('❌ Photo upload error:', error);
      showNotification('error', 'Upload Error', error.message || 'An unexpected error occurred. Please try again.');
    }
  };
  
  const handleSavePersonalInfo = async () => {
    if (!user?.id) {
      showNotification('error', 'User Not Found', 'Unable to identify user. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('💾 Saving personal info to database:', personalInfo);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication Required', 'Please login again to save your personal information.');
        return;
      }
      
      const response = await fetch(`http://localhost:4001/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: personalInfo.email,
          phone: personalInfo.phone,
          dob: personalInfo.dateOfBirth,
          gender: personalInfo.gender
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || 'Failed to update personal info');
      }

      const result = await response.json();
      console.log('✅ Personal info saved successfully:', result);

      // Update parent component
      if (onUserUpdate && user) {
        onUserUpdate({
          ...user,
          email: personalInfo.email,
          phone: personalInfo.phone,
          dateOfBirth: personalInfo.dateOfBirth,
          gender: personalInfo.gender
        });
      }

      showNotification('success', 'Information Updated!', 'Your personal information has been saved successfully.');
      setIsEditingPersonal(false);
    } catch (error: any) {
      console.error('❌ Failed to save personal info:', error);
      showNotification('error', 'Update Failed', error.message || 'Unable to save personal information. Please check your connection and try again.');
    }
  };
  
  const handleSaveEmergencyContact = async () => {
    if (!user?.id) {
      showNotification('error', 'User Not Found', 'Unable to identify user. Please refresh the page and try again.');
      return;
    }

    // Validate emergency contact data
    if (!emergencyContact.name || emergencyContact.name.trim() === '') {
      showNotification('warning', 'Name Required', 'Please enter the emergency contact\'s name.');
      return;
    }

    if (!emergencyContact.phone || emergencyContact.phone.trim() === '') {
      showNotification('warning', 'Phone Required', 'Please enter the emergency contact\'s phone number.');
      return;
    }

    try {
      console.log('💾 Saving emergency contact to database:', emergencyContact);
      console.log('🔑 User ID:', user.id);
      
      // Get auth token (try both possible token storage keys)
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      console.log('🔐 Token exists:', !!token);
      
      if (!token) {
        showNotification('error', 'Authentication Required', 'Please login again to save emergency contact information.');
        console.error('❌ No auth token found in localStorage');
        return;
      }
      console.log('🔑 Auth token found:', token.substring(0, 20) + '...');
      
      // Update user profile via API
      const apiUrl = `http://localhost:4001/api/users/${user.id}`;
      console.log('📡 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emergency_contact_name: emergencyContact.name,
          emergency_contact_phone: emergencyContact.phone,
          emergency_contact_country_code: emergencyContact.countryCode
        })
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        console.error('❌ Server error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to update emergency contact');
      }

      const result = await response.json();
      console.log('✅ Emergency contact saved successfully:', result);

      // Update local user state
      if (onUserUpdate && user) {
        onUserUpdate({
          ...user,
          emergencyContactName: emergencyContact.name,
          emergencyContactPhone: emergencyContact.phone,
          emergencyContactCountryCode: emergencyContact.countryCode
        });
      }

      showNotification('success', 'Emergency Contact Saved!', 'Your emergency contact information has been updated successfully.');
      setIsEditingEmergency(false);
    } catch (error: any) {
      console.error('❌ Failed to save emergency contact:', error);
      showNotification('error', 'Update Failed', error.message || 'Unable to save emergency contact. Please check your connection and try again.');
    }
  };
  
  const handleSaveSettings = async () => {
    if (!user?.id) return;

    try {
      // Get auth token (try both possible token storage keys)
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Authentication Required', 'Please login again to save your settings.');
        console.error('❌ No auth token found in localStorage');
        return;
      }

      const response = await fetch(`http://localhost:4001/api/settings/user/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        showNotification('success', 'Settings Saved!', 'Your preferences have been updated successfully.');
        setIsEditingSettings(false);
      } else {
        showNotification('error', 'Save Failed', 'Unable to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification('error', 'Connection Error', 'Unable to connect to server. Please check your connection and try again.');
    }
  };
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, pushNotifications: true }));
        showNotification('success', 'Notifications Enabled!', 'You will now receive push notifications from Viking Hammer.');
      } else {
        showNotification('warning', 'Permission Denied', 'Push notifications are disabled. You can enable them later in your browser settings.');
      }
    } else {
      showNotification('error', 'Not Supported', 'Your browser does not support push notifications.');
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
              <p className="section-description">Update your contact details and personal information</p>
              {!isEditingPersonal && (
                <button className="btn btn-primary btn-sm" onClick={() => setIsEditingPersonal(true)}>
                  ✏️ Edit
                </button>
              )}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={user?.firstName || ''} 
                  readOnly
                  disabled
                  title="First name cannot be edited"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={user?.lastName || ''} 
                  readOnly
                  disabled
                  title="Last name cannot be edited"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={isEditingPersonal ? personalInfo.email : (user?.email || '')}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                  readOnly={!isEditingPersonal}
                  disabled={!isEditingPersonal}
                  placeholder="Enter email"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="phone-input-group">
                  <select 
                    className="country-code-select"
                    value={personalInfo.countryCode}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, countryCode: e.target.value }))}
                    disabled={!isEditingPersonal}
                  >
                    <option value="+994">🇦🇿 +994</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                  </select>
                  <input 
                    type="tel" 
                    className="form-input phone-input" 
                    value={isEditingPersonal ? personalInfo.phone : (user?.phone || '')}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setPersonalInfo(prev => ({ ...prev, phone: value }));
                    }}
                    readOnly={!isEditingPersonal}
                    disabled={!isEditingPersonal}
                    placeholder="Enter phone number (numbers only)"
                    maxLength={15}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                {isEditingPersonal ? (
                  <input 
                    type="date" 
                    className="form-input" 
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                ) : (
                  <input 
                    type="text" 
                    className="form-input" 
                    value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : ''}
                    readOnly
                    disabled
                  />
                )}
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select 
                  className="form-input" 
                  value={isEditingPersonal ? personalInfo.gender : (user?.gender || '')}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
                  disabled={!isEditingPersonal}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            {isEditingPersonal && (
              <div className="action-buttons">
                <button className="btn btn-success" onClick={handleSavePersonalInfo}>
                  ✅ Save Changes
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setIsEditingPersonal(false);
                  setPersonalInfo({
                    email: user?.email || '',
                    phone: user?.phone || '',
                    countryCode: user?.countryCode || '+994',
                    dateOfBirth: user?.dateOfBirth || '',
                    gender: user?.gender || ''
                  });
                }}>
                  ❌ Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="profile-section">
            <div className="section-header">
              <h3>💎 My Subscription</h3>
              <p className="section-description">Manage your membership and view subscription details</p>
            </div>
            
            {isLoadingSubscription ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading subscription details...</p>
              </div>
            ) : subscription ? (
              <div className="subscription-card">
                <div className={`subscription-badge ${subscription.status || 'active'}`}>
                  {subscription.status === 'active' ? 'Active Membership' : 
                   subscription.status === 'suspended' ? 'Suspended' :
                   subscription.status === 'expired' ? 'Expired' : 'Membership'}
                </div>
                <div className="subscription-details">
                  <div className="detail-row">
                    <span className="detail-icon">🎯</span>
                    <div className="detail-content">
                      <span className="detail-label">Membership Type</span>
                      <span className="detail-value subscription-value">
                        {subscription.plan_name || user?.membershipType || 'Viking Warrior Basic'}
                      </span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <div className="detail-content">
                      <span className="detail-label">Start Date</span>
                      <span className="detail-value subscription-value">
                        {formatDate(subscription.start_date || user?.joinDate || new Date().toISOString())}
                      </span>
                    </div>
                  </div>
                  {subscription.end_date && (
                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <div className="detail-content">
                        <span className="detail-label">End Date</span>
                        <span className="detail-value subscription-value">
                          {formatDate(subscription.end_date)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-icon">✅</span>
                    <div className="detail-content">
                      <span className="detail-label">Status</span>
                      <span className={`detail-value status-${subscription.status || 'active'}`}>
                        {subscription.status === 'active' ? 'Active' :
                         subscription.status === 'suspended' ? 'Suspended' :
                         subscription.status === 'expired' ? 'Expired' :
                         subscription.status === 'cancelled' ? 'Cancelled' : 'Active'}
                      </span>
                    </div>
                  </div>
                  {subscription.next_billing_date && (
                    <div className="detail-row">
                      <span className="detail-icon">💰</span>
                      <div className="detail-content">
                        <span className="detail-label">Next Payment</span>
                        <span className="detail-value subscription-value">
                          {formatDate(subscription.next_billing_date)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-icon">🏋️</span>
                    <div className="detail-content">
                      <span className="detail-label">Remaining Entries</span>
                      <span className="detail-value subscription-value">
                        {subscription.remaining_entries !== null && subscription.remaining_entries !== undefined
                          ? subscription.remaining_entries
                          : subscription.class_limit 
                          ? `${subscription.class_limit} per month`
                          : 'Unlimited'}
                      </span>
                    </div>
                  </div>
                  {subscription.amount && (
                    <div className="detail-row">
                      <span className="detail-icon">💵</span>
                      <div className="detail-content">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value subscription-value">
                          {subscription.currency || 'AZN'} {subscription.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="subscription-actions">
                  <button className="btn btn-primary" onClick={() => setShowHistoryModal(true)}>
                    📊 View History
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-container">
                <span className="empty-icon">💳</span>
                <h3>No Active Subscription</h3>
                <p>You don't have an active subscription yet. Contact reception to set up your membership.</p>
              </div>
            )}
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
                    type="tel" 
                    className="form-input phone-input" 
                    value={isEditingEmergency ? emergencyContact.phone : (user?.emergencyContactPhone || 'Not provided')}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEmergencyContact(prev => ({ ...prev, phone: value }));
                    }}
                    readOnly={!isEditingEmergency}
                    disabled={!isEditingEmergency}
                    placeholder="Enter phone number (numbers only)"
                    maxLength={15}
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
                                {formatDate(record.start_date)}
                              </span>
                            </div>
                          </div>
                          
                          {record.end_date ? (
                            <div className="info-item">
                              <span className="info-icon">📅</span>
                              <div className="info-content">
                                <span className="info-label">End Date</span>
                                <span className="info-value">
                                  {formatDate(record.end_date)}
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
                                  {formatDate(record.next_billing_date)}
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

      {/* Custom Notification Modal */}
      {notificationModal.show && (
        <div className="modal-overlay" onClick={closeNotification}>
          <div 
            className={`modal-content notification-modal notification-${notificationModal.type}`} 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="notification-title"
            aria-describedby="notification-message"
          >
            <div className="notification-header">
              <div className="notification-icon-wrapper">
                {notificationModal.type === 'success' && <span className="notification-icon">✅</span>}
                {notificationModal.type === 'error' && <span className="notification-icon">❌</span>}
                {notificationModal.type === 'warning' && <span className="notification-icon">⚠️</span>}
                {notificationModal.type === 'info' && <span className="notification-icon">ℹ️</span>}
              </div>
              <h3 className="notification-title" id="notification-title">{notificationModal.title}</h3>
              <button 
                className="notification-close" 
                onClick={closeNotification}
                aria-label="Close notification"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="notification-body">
              <p className="notification-message" id="notification-message">{notificationModal.message}</p>
            </div>
            <div className="notification-footer">
              <button 
                className={`btn btn-${notificationModal.type === 'success' ? 'success' : notificationModal.type === 'error' ? 'danger' : 'primary'}`}
                onClick={closeNotification}
                autoFocus
              >
                {notificationModal.type === 'success' ? '✨ Great!' : notificationModal.type === 'error' ? '👍 Got it' : '✓ OK'}
              </button>
            </div>
            {notificationModal.autoClose && notificationModal.type === 'success' && (
              <div className="notification-progress">
                <div className="notification-progress-bar"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
