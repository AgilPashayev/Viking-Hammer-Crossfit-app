import React from 'react';

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

  const containerStyle = {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const avatarStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0b5eff, #4a90e2)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 auto 15px',
  };

  const tabContainerStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '10px 10px 0 0',
  };

  const getTabStyle = (tabName: string) => ({
    padding: '10px 20px',
    border: 'none',
    background: activeTab === tabName ? '#0b5eff' : 'transparent',
    color: activeTab === tabName ? 'white' : '#666',
    cursor: 'pointer',
    borderRadius: '5px',
    fontSize: '14px',
  });

  const contentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '0 0 10px 10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const sectionTitleStyle = {
    marginBottom: '20px',
    color: '#0b5eff',
    fontSize: '18px',
    fontWeight: 'bold',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  };

  const fieldStyle = {
    marginBottom: '10px',
  };

  const labelStyle = {
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
  };

  const valueStyle = {
    margin: '5px 0',
    color: '#666',
    fontSize: '14px',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={avatarStyle}>
          {user?.firstName?.[0]?.toUpperCase() || 'V'}
          {user?.lastName?.[0]?.toUpperCase() || 'W'}
        </div>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
          {user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : 'Viking Warrior'}
        </h1>
        <p style={{ color: '#666', margin: 0 }}>{user?.membershipType || 'Viking Warrior Basic'}</p>
      </div>

      <div style={tabContainerStyle}>
        <button onClick={() => setActiveTab('personal')} style={getTabStyle('personal')}>
          👤 Personal Info
        </button>
        <button onClick={() => setActiveTab('membership')} style={getTabStyle('membership')}>
          🎫 Membership
        </button>
        <button onClick={() => setActiveTab('emergency')} style={getTabStyle('emergency')}>
          🚨 Emergency Contact
        </button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'personal' && (
          <div>
            <h3 style={sectionTitleStyle}>Personal Information</h3>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <div style={labelStyle}>First Name:</div>
                <div style={valueStyle}>{user?.firstName || 'Not provided'}</div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Last Name:</div>
                <div style={valueStyle}>{user?.lastName || 'Not provided'}</div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Email:</div>
                <div style={valueStyle}>{user?.email || 'Not provided'}</div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Phone:</div>
                <div style={valueStyle}>
                  {user?.countryCode && user?.phone
                    ? `${user.countryCode} ${user.phone}`
                    : 'Not provided'}
                </div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Date of Birth:</div>
                <div style={valueStyle}>{user?.dateOfBirth || 'Not provided'}</div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Gender:</div>
                <div style={valueStyle}>
                  {user?.gender
                    ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
                    : 'Not provided'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'membership' && (
          <div>
            <h3 style={sectionTitleStyle}>Membership Information</h3>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <div style={labelStyle}>Membership Type:</div>
                <div
                  style={{
                    ...valueStyle,
                    background: '#f0f8ff',
                    padding: '8px 12px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    color: '#0b5eff',
                  }}
                >
                  {user?.membershipType || 'Viking Warrior Basic'}
                </div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Member Since:</div>
                <div style={valueStyle}>
                  {user?.joinDate
                    ? new Date(user.joinDate).toLocaleDateString()
                    : 'Recently joined'}
                </div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Status:</div>
                <div style={{ ...valueStyle, color: '#4caf50', fontWeight: 'bold' }}>Active ✅</div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Member ID:</div>
                <div style={valueStyle}>{user?.email?.split('@')[0] || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div>
            <h3 style={sectionTitleStyle}>Emergency Contact</h3>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <div style={labelStyle}>Contact Name:</div>
                <div style={valueStyle}>{user?.emergencyContactName || 'Not provided'}</div>
              </div>
              <div style={fieldStyle}>
                <div style={labelStyle}>Phone Number:</div>
                <div style={valueStyle}>
                  {user?.emergencyContactCountryCode && user?.emergencyContactPhone
                    ? `${user.emergencyContactCountryCode} ${user.emergencyContactPhone}`
                    : 'Not provided'}
                </div>
              </div>
            </div>
            {(!user?.emergencyContactName || !user?.emergencyContactPhone) && (
              <div
                style={{
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  padding: '15px',
                  borderRadius: '5px',
                  marginTop: '20px',
                  fontSize: '14px',
                }}
              >
                <p style={{ margin: 0 }}>
                  💡 <strong>Tip:</strong> Adding emergency contact information helps us keep you
                  safe during workouts.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => onNavigate?.('dashboard')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0b5eff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default MyProfile;
