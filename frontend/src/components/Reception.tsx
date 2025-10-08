import React, { useState, useRef, useEffect } from 'react';
import MemberManagement from './MemberManagement';
import CheckInHistory from './CheckInHistory';
import ClassManagement from './ClassManagement';
import AnnouncementManager from './AnnouncementManager';
import MembershipManager from './MembershipManager';
import UpcomingBirthdays from './UpcomingBirthdays';
import { validateQRCode } from '../services/qrCodeService';
import './Reception.css';

interface ReceptionProps {
  onNavigate?: (page: string) => void;
}

const Reception: React.FC<ReceptionProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock data for real numbers
  const [realStats, setRealStats] = useState({
    totalMembers: 0,
    checkedInToday: 0,
    instructors: 0,
    activeClasses: 0,
    expiringMemberships: 0,
    upcomingBirthdays: 0,
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'checkin', user: 'John Viking', time: '2 minutes ago', icon: '✅' },
    { id: 2, type: 'signup', user: 'Sarah Connor', time: '15 minutes ago', icon: '👤' },
    { id: 3, type: 'payment', user: 'Mike Johnson', time: '1 hour ago', icon: '💳' },
    { id: 4, type: 'birthday', user: 'Emma Wilson', time: '2 hours ago', icon: '🎂' },
    { id: 5, type: 'checkin', user: 'David Kim', time: '3 hours ago', icon: '✅' },
    { id: 6, type: 'class', user: 'Lisa Chen', time: '4 hours ago', icon: '🏋️' },
    { id: 7, type: 'signup', user: 'Alex Mueller', time: '5 hours ago', icon: '👤' },
    { id: 8, type: 'payment', user: 'Anna Petrov', time: '6 hours ago', icon: '💳' },
    { id: 9, type: 'checkin', user: 'James Wilson', time: '7 hours ago', icon: '✅' },
    { id: 10, type: 'class', user: 'Elena Rodriguez', time: '8 hours ago', icon: '🏋️' },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadRealStats();
    return () => {
      stopCamera();
    };
  }, []);

  const loadRealStats = () => {
    // Simulate loading real data
    setRealStats({
      totalMembers: 245,
      checkedInToday: 48,
      instructors: 12,
      activeClasses: 8,
      expiringMemberships: 7,
      upcomingBirthdays: 3,
    });
  };

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
        // Add to recent activity
        const newActivity = {
          id: Date.now(),
          type: 'checkin',
          user: 'Member',
          time: 'Just now',
          icon: '✅',
        };
        setRecentActivity((prev) => [newActivity, ...prev.slice(0, 9)]);

        // Update checked in today count
        setRealStats((prev) => ({
          ...prev,
          checkedInToday: prev.checkedInToday + 1,
        }));

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
    setShowQRScanner(true);
    startCamera();
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
            <h3>{realStats.totalMembers}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="stat-card success clickable" onClick={() => setActiveSection('checkins')}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{realStats.checkedInToday}</h3>
            <p>Checked In Today</p>
          </div>
        </div>
        <div className="stat-card info clickable" onClick={() => setActiveSection('classes')}>
          <div className="stat-icon">🏋️</div>
          <div className="stat-content">
            <h3>{realStats.instructors}</h3>
            <p>Instructors</p>
          </div>
        </div>
        <div className="stat-card warning clickable" onClick={() => setActiveSection('classes')}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{realStats.activeClasses}</h3>
            <p>Active Classes</p>
          </div>
        </div>
        <div className="stat-card danger clickable" onClick={() => setActiveSection('memberships')}>
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{realStats.expiringMemberships}</h3>
            <p>Expiring Soon (7 days)</p>
          </div>
        </div>
        <div className="stat-card birthday clickable" onClick={() => setActiveSection('birthdays')}>
          <div className="stat-icon">🎂</div>
          <div className="stat-content">
            <h3>{realStats.upcomingBirthdays}</h3>
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
            <div className="card-badge">{realStats.upcomingBirthdays} This Week</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon success">✅</div>
            <div className="activity-content">
              <p>
                <strong>John Viking</strong> checked in
              </p>
              <span>2 minutes ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon info">👤</div>
            <div className="activity-content">
              <p>
                New member <strong>Sarah Connor</strong> registered
              </p>
              <span>15 minutes ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon warning">💳</div>
            <div className="activity-content">
              <p>
                <strong>Mike Johnson</strong> payment due tomorrow
              </p>
              <span>1 hour ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon birthday">🎂</div>
            <div className="activity-content">
              <p>
                <strong>Emma Wilson</strong> birthday tomorrow
              </p>
              <span>2 hours ago</span>
            </div>
          </div>
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
