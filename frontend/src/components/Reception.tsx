import React, { useState, useRef, useEffect } from 'react';
import MemberManagement from './MemberManagement';
import CheckInHistory from './CheckInHistory';
import ClassManagement from './ClassManagement';
import AnnouncementManager from './AnnouncementManager';
import MembershipManager from './MembershipManager';
import UpcomingBirthdays from './UpcomingBirthdays';
import { validateQRCode } from '../services/qrCodeService';
import { useData, Activity } from '../contexts/DataContext';
import './Reception.css';

interface ReceptionProps {
  onNavigate?: (page: string) => void;
}

const Reception: React.FC<ReceptionProps> = ({ onNavigate }) => {
  const { stats, members, checkInMember, activities, getUpcomingBirthdays } = useData();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // activity rendering utils
  const timeAgo = (ts: string) => {
    const now = new Date().getTime();
    const then = new Date(ts).getTime();
    const diff = Math.max(0, now - then);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
    const day = Math.floor(hr / 24);
    return `${day} day${day === 1 ? '' : 's'} ago`;
  };

  const iconFor = (type: Activity['type']) => {
    switch (type) {
      case 'checkin': return { icon: '✅', cls: 'success' };
      case 'member_added': return { icon: '👤', cls: 'info' };
      case 'member_updated': return { icon: '🛠️', cls: 'info' };
      case 'membership_changed': return { icon: '💳', cls: 'warning' };
      case 'announcement_created': return { icon: '�', cls: 'info' };
      case 'announcement_published': return { icon: '📢', cls: 'success' };
      case 'announcement_deleted': return { icon: '🗑️', cls: 'warning' };
      case 'birthday_upcoming': return { icon: '🎂', cls: 'birthday' };
      default: return { icon: 'ℹ️', cls: 'info' };
    }
  };

  const buildActivityFeed = (): Array<{ id: string; type: Activity['type']; message: string; timestamp: string }> => {
    const base: Array<{ id: string; type: Activity['type']; message: string; timestamp: string; memberId?: string }>
      = activities.map(a => ({ id: a.id, type: a.type, message: a.message, timestamp: a.timestamp, memberId: a.memberId }));
    // Synthesize upcoming birthday activities (next 7 days)
    const bdays = getUpcomingBirthdays();
    const bdayActs = bdays.map(m => {
      const msg = `${m.firstName} ${m.lastName} birthday upcoming`;
      const today = new Date();
      const dob = new Date(m.dateOfBirth as string);
      const thisYear = today.getFullYear();
      const occurrence = new Date(thisYear, dob.getMonth(), dob.getDate());
      return {
        id: `bday_${m.id}_${occurrence.toISOString().split('T')[0]}`,
        type: 'birthday_upcoming' as const,
        message: msg,
        timestamp: occurrence.toISOString(),
        memberId: m.id,
      };
    });

    const merged = [...base, ...bdayActs];
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged.slice(0, 20);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // QR Scanner functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanResult({
        isValid: false,
        error: 'Camera access denied. Please allow camera permissions.',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setShowQRScanner(false);
  };

  const captureQRCode = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Simulate QR code detection
        const simulatedQRData = JSON.stringify({
          userId: 'user' + Date.now(),
          email: 'member@example.com',
          membershipType: 'Viking Warrior Pro',
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          checkInId: 'checkin_' + Date.now(),
        });
        processScan(simulatedQRData);
        stopCamera();
      }
    }
  };

  const processScan = async (qrData: string) => {
    setIsScanning(true);
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        parsedData = {
          userId: qrData.split('-')[2] || 'unknown',
          email: 'demo@example.com',
          membershipType: 'Basic',
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          checkInId: qrData,
        };
      }

      const result = await validateQRCode(parsedData);
      setScanResult(result);

      if (result.isValid) {
        // Update member check-in (this would normally use the member ID from QR code)
        // For demo purposes, we'll check in the first member
        if (members.length > 0) {
          checkInMember(members[0].id);
        }

        setScanResult({
          success: true,
          message: 'Welcome back! Check-in successful.',
          member: {
            id: 'MB001',
            name: 'John Doe',
            status: 'Active',
          },
        });
      } else {
        setScanResult({
          success: false,
          message: result.reason || 'QR Code verification failed',
        });
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: 'Failed to validate QR code',
      });
    }
    setIsScanning(false);
  };

  const handleQRScanClick = () => {
    // Direct camera access - no separate QR scanner page
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
      setShowQRScanner(true);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
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
          <button className="btn btn-primary" onClick={handleQRScanClick}>
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
            <div className="card-badge">{stats.totalMembers} Members</div>
          </div>

          <div className="management-card" onClick={() => setActiveSection('checkins')}>
            <div className="card-icon">📊</div>
            <h3>Check-In History</h3>
            <p>View and analyze member check-in data</p>
            <div className="card-badge">{stats.checkedInToday} Today</div>
          </div>

          <div className="management-card" onClick={() => setActiveSection('classes')}>
            <div className="card-icon">🏋️‍♂️</div>
            <h3>Class Management</h3>
            <p>Assign instructors and manage class schedules</p>
            <div className="card-badge">{stats.activeClasses} Active</div>
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
            <div className="card-badge">{stats.plansCount} Plans</div>
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
          {buildActivityFeed().map((item) => {
            const m = iconFor(item.type);
            return (
              <div key={item.id} className="activity-item">
                <div className={`activity-icon ${m.cls}`}>{m.icon}</div>
                <div className="activity-content">
                  <p>{item.message}</p>
                  <span>{timeAgo(item.timestamp)}</span>
                </div>
              </div>
            );
          })}
          {buildActivityFeed().length === 0 && (
            <div className="activity-item">
              <div className="activity-icon info">ℹ️</div>
              <div className="activity-content">
                <p>No recent activity yet</p>
                <span>—</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="reception">
      {showQRScanner && (
        <div className="qr-scanner-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>QR Code Scanner</h3>
              <button
                className="btn-close"
                onClick={() => {
                  stopCamera();
                  setShowQRScanner(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {!cameraActive && !scanResult && (
                <div className="scanner-controls">
                  <p>Position the QR code in front of your camera</p>
                  <button className="btn btn-primary" onClick={startCamera}>
                    📷 Start Camera
                  </button>
                </div>
              )}

              {cameraActive && (
                <div className="camera-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', maxWidth: '400px' }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="scanner-controls">
                    <button
                      className="btn btn-success"
                      onClick={captureQRCode}
                      disabled={isScanning}
                    >
                      {isScanning ? '🔄 Scanning...' : '📷 Capture QR'}
                    </button>
                    <button className="btn btn-secondary" onClick={stopCamera}>
                      🛑 Stop Camera
                    </button>
                  </div>
                </div>
              )}

              {scanResult && (
                <div className="scan-result">
                  <div className={`result-message ${scanResult.success ? 'success' : 'error'}`}>
                    <h4>{scanResult.success ? '✅ Valid QR Code' : '❌ Invalid QR Code'}</h4>
                    <p>{scanResult.message}</p>
                    {scanResult.member && (
                      <div className="member-info">
                        <p>
                          <strong>Member:</strong> {scanResult.member.name}
                        </p>
                        <p>
                          <strong>ID:</strong> {scanResult.member.id}
                        </p>
                        <p>
                          <strong>Status:</strong> {scanResult.member.status}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setScanResult(null);
                      startCamera();
                    }}
                  >
                    🔄 Scan Another
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {renderActiveSection()}
    </div>
  );
};

export default Reception;
