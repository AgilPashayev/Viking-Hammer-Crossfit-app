import React, { useState } from 'react';
import './MyProfile.css';

interface UserProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    avatar?: string;
  };
  membership: {
    membershipType: string;
    joinDate: string;
    membershipId: string;
    status: string;
    nextBillingDate: string;
    paymentMethod: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  healthInfo: {
    medicalConditions: string[];
    allergies: string[];
    fitnessGoals: string[];
    fitnessLevel: string;
    injuries: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    privacy: {
      profileVisibility: string;
      workoutVisibility: string;
    };
    workoutPreferences: string[];
  };
}

interface MyProfileProps {
  onNavigate?: (page: string) => void;
}

const MyProfile: React.FC<MyProfileProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    personalInfo: {
      firstName: 'Erik',
      lastName: 'Andersson',
      email: 'erik.andersson@email.com',
      phone: '+46 70 123 4567',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      avatar: undefined,
    },
    membership: {
      membershipType: 'Viking Warrior Premium',
      joinDate: '2023-01-15',
      membershipId: 'VH-2023-001',
      status: 'Active',
      nextBillingDate: '2024-02-15',
      paymentMethod: 'Credit Card ****1234',
    },
    emergencyContact: {
      name: 'Anna Andersson',
      relationship: 'Spouse',
      phone: '+46 70 987 6543',
      email: 'anna.andersson@email.com',
    },
    healthInfo: {
      medicalConditions: ['Asthma'],
      allergies: ['Nuts', 'Shellfish'],
      fitnessGoals: ['Strength Building', 'Weight Loss', 'Endurance'],
      fitnessLevel: 'Intermediate',
      injuries: 'Previous knee injury (2022)',
    },
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      privacy: {
        profileVisibility: 'Members Only',
        workoutVisibility: 'Private',
      },
      workoutPreferences: ['CrossFit', 'Powerlifting', 'Cardio'],
    },
  });

  const updateProfile = (section: keyof UserProfile, field: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const updateNestedProfile = (
    section: keyof UserProfile,
    subsection: string,
    field: string,
    value: any,
  ) => {
    setProfile((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [subsection]: {
          ...(prev[section] as any)?.[subsection],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log('Saving profile:', profile);
    // Here you would make an API call to save the profile
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset any unsaved changes if needed
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const addArrayItem = (section: keyof UserProfile, field: string, item: string) => {
    const currentArray = (profile[section] as any)[field] || [];
    updateProfile(section, field, [...currentArray, item]);
  };

  const removeArrayItem = (section: keyof UserProfile, field: string, index: number) => {
    const currentArray = (profile[section] as any)[field] || [];
    updateProfile(
      section,
      field,
      currentArray.filter((_: any, i: number) => i !== index),
    );
  };

  const renderPersonalInfo = () => (
    <div className="profile-section">
      <h3>Personal Information</h3>
      <div className="profile-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={profile.personalInfo.firstName}
              disabled={!isEditing}
              onChange={(e) => updateProfile('personalInfo', 'firstName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={profile.personalInfo.lastName}
              disabled={!isEditing}
              onChange={(e) => updateProfile('personalInfo', 'lastName', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profile.personalInfo.email}
              disabled={!isEditing}
              onChange={(e) => updateProfile('personalInfo', 'email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={profile.personalInfo.phone}
              disabled={!isEditing}
              onChange={(e) => updateProfile('personalInfo', 'phone', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={profile.personalInfo.dateOfBirth}
              disabled={!isEditing}
              onChange={(e) => updateProfile('personalInfo', 'dateOfBirth', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select
              value={profile.personalInfo.gender}
              disabled={!isEditing}
              onChange={(e) => updateProfile('personalInfo', 'gender', e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMembership = () => (
    <div className="profile-section">
      <h3>Membership Details</h3>
      <div className="membership-info">
        <div className="membership-card">
          <div className="membership-header">
            <h4>{profile.membership.membershipType}</h4>
            <span className={`status ${profile.membership.status.toLowerCase()}`}>
              {profile.membership.status}
            </span>
          </div>
          <div className="membership-details">
            <div className="detail-item">
              <label>Member ID:</label>
              <span>{profile.membership.membershipId}</span>
            </div>
            <div className="detail-item">
              <label>Join Date:</label>
              <span>{new Date(profile.membership.joinDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <label>Next Billing:</label>
              <span>{new Date(profile.membership.nextBillingDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <label>Payment Method:</label>
              <span>{profile.membership.paymentMethod}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmergencyContact = () => (
    <div className="profile-section">
      <h3>Emergency Contact</h3>
      <div className="profile-form">
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={profile.emergencyContact.name}
              disabled={!isEditing}
              onChange={(e) => updateProfile('emergencyContact', 'name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Relationship</label>
            <input
              type="text"
              value={profile.emergencyContact.relationship}
              disabled={!isEditing}
              onChange={(e) => updateProfile('emergencyContact', 'relationship', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={profile.emergencyContact.phone}
              disabled={!isEditing}
              onChange={(e) => updateProfile('emergencyContact', 'phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profile.emergencyContact.email}
              disabled={!isEditing}
              onChange={(e) => updateProfile('emergencyContact', 'email', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealthInfo = () => (
    <div className="profile-section">
      <h3>Health Information</h3>
      <div className="profile-form">
        <div className="form-group">
          <label>Fitness Level</label>
          <select
            value={profile.healthInfo.fitnessLevel}
            disabled={!isEditing}
            onChange={(e) => updateProfile('healthInfo', 'fitnessLevel', e.target.value)}
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="form-group">
          <label>Medical Conditions</label>
          <div className="tag-input">
            {profile.healthInfo.medicalConditions.map((condition, index) => (
              <span key={index} className="tag">
                {condition}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('healthInfo', 'medicalConditions', index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                placeholder="Add condition..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      addArrayItem('healthInfo', 'medicalConditions', value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Allergies</label>
          <div className="tag-input">
            {profile.healthInfo.allergies.map((allergy, index) => (
              <span key={index} className="tag">
                {allergy}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('healthInfo', 'allergies', index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                placeholder="Add allergy..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      addArrayItem('healthInfo', 'allergies', value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Fitness Goals</label>
          <div className="tag-input">
            {profile.healthInfo.fitnessGoals.map((goal, index) => (
              <span key={index} className="tag">
                {goal}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('healthInfo', 'fitnessGoals', index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                placeholder="Add goal..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      addArrayItem('healthInfo', 'fitnessGoals', value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Injuries & Notes</label>
          <textarea
            value={profile.healthInfo.injuries}
            disabled={!isEditing}
            onChange={(e) => updateProfile('healthInfo', 'injuries', e.target.value)}
            placeholder="Any previous injuries or health notes..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="profile-section">
      <h3>Preferences & Settings</h3>
      <div className="preferences-form">
        <div className="preference-group">
          <h4>Notifications</h4>
          <div className="toggle-group">
            <div className="toggle-item">
              <label>Email Notifications</label>
              <input
                type="checkbox"
                checked={profile.preferences.notifications.email}
                disabled={!isEditing}
                onChange={(e) =>
                  updateNestedProfile('preferences', 'notifications', 'email', e.target.checked)
                }
                className="toggle-checkbox"
              />
            </div>
            <div className="toggle-item">
              <label>SMS Notifications</label>
              <input
                type="checkbox"
                checked={profile.preferences.notifications.sms}
                disabled={!isEditing}
                onChange={(e) =>
                  updateNestedProfile('preferences', 'notifications', 'sms', e.target.checked)
                }
                className="toggle-checkbox"
              />
            </div>
            <div className="toggle-item">
              <label>Push Notifications</label>
              <input
                type="checkbox"
                checked={profile.preferences.notifications.push}
                disabled={!isEditing}
                onChange={(e) =>
                  updateNestedProfile('preferences', 'notifications', 'push', e.target.checked)
                }
                className="toggle-checkbox"
              />
            </div>
          </div>
        </div>

        <div className="preference-group">
          <h4>Privacy Settings</h4>
          <div className="form-group">
            <label>Profile Visibility</label>
            <select
              value={profile.preferences.privacy.profileVisibility}
              disabled={!isEditing}
              onChange={(e) =>
                updateNestedProfile('preferences', 'privacy', 'profileVisibility', e.target.value)
              }
            >
              <option value="Public">Public</option>
              <option value="Members Only">Members Only</option>
              <option value="Private">Private</option>
            </select>
          </div>
          <div className="form-group">
            <label>Workout Visibility</label>
            <select
              value={profile.preferences.privacy.workoutVisibility}
              disabled={!isEditing}
              onChange={(e) =>
                updateNestedProfile('preferences', 'privacy', 'workoutVisibility', e.target.value)
              }
            >
              <option value="Public">Public</option>
              <option value="Members Only">Members Only</option>
              <option value="Private">Private</option>
            </select>
          </div>
        </div>

        <div className="preference-group">
          <h4>Workout Preferences</h4>
          <div className="tag-input">
            {profile.preferences.workoutPreferences.map((preference, index) => (
              <span key={index} className="tag">
                {preference}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('preferences', 'workoutPreferences', index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                placeholder="Add preference..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      addArrayItem('preferences', 'workoutPreferences', value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'membership':
        return renderMembership();
      case 'emergency':
        return renderEmergencyContact();
      case 'health':
        return renderHealthInfo();
      case 'preferences':
        return renderPreferences();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="my-profile">
      <div className="profile-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Dashboard
        </button>
        <div className="profile-title">
          <h2>My Profile</h2>
          <div className="profile-actions">
            {!isEditing ? (
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-button" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal
        </button>
        <button
          className={`tab ${activeTab === 'membership' ? 'active' : ''}`}
          onClick={() => setActiveTab('membership')}
        >
          Membership
        </button>
        <button
          className={`tab ${activeTab === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveTab('emergency')}
        >
          Emergency
        </button>
        <button
          className={`tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          Health
        </button>
        <button
          className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Settings
        </button>
      </div>

      <div className="profile-content">{renderTabContent()}</div>
    </div>
  );
};

export default MyProfile;
