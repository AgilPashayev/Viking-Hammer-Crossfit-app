import React, { useState, useRef, useEffect } from 'react';
import MemberManagement from './MemberManagement';
import CheckInHistory from './CheckInHistory';
import ClassManagement from './ClassManagement';
import AnnouncementManager from './AnnouncementManager';
import MembershipManager from './MembershipManager';
import UpcomingBirthdays from './UpcomingBirthdays';
import jsQR from 'jsqr';
import { useData, Activity } from '../contexts/DataContext';
import './Reception.css';

interface ReceptionProps {
  onNavigate?: (page: string) => void;
  user?: any;
}

const Reception: React.FC<ReceptionProps> = ({ onNavigate, user }) => {
  const { stats, members, checkInMember, activities, getUpcomingBirthdays } = useData();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showMemberReview, setShowMemberReview] = useState(false);
  const [scannedMemberData, setScannedMemberData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

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

  // Format activity messages with bold names, actions, and updatedBy info
  const formatActivityMessage = (
    message: string,
    updatedBy?: { name: string; role: string },
  ): React.ReactElement => {
    // Patterns to match:
    // "John Doe checked in" -> <strong>John Doe</strong> checked in
    // "New member: Jane Smith" -> New member: <strong>Jane Smith</strong>
    // "Class created: CrossFit 101" -> <strong>Class created:</strong> CrossFit 101

    // Pattern 0: Special case for "Member profile updated" or "Unknown Member profile updated"
    if (message.match(/^(Member|Unknown Member) profile updated$/i)) {
      return (
        <span>
          <strong>Member</strong> profile updated
          {updatedBy && (
            <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '4px' }}>
              by <strong style={{ color: '#2563eb' }}>{updatedBy.name}</strong>
              <span style={{ textTransform: 'capitalize', marginLeft: '2px' }}>
                ({updatedBy.role})
              </span>
            </span>
          )}
        </span>
      );
    }

    // Pattern 1: Name at the start (e.g., "John Doe checked in" or "John Doe profile updated")
    const nameAtStartMatch = message.match(
      /^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)*) (checked in|profile updated|birthday upcoming)/i,
    );
    if (nameAtStartMatch) {
      const [, name, action] = nameAtStartMatch;
      const formattedAction =
        action.toLowerCase() === 'profile updated' ? 'profile updated' : action;

      return (
        <span>
          <strong>{name}</strong> {formattedAction}
          {updatedBy && action.toLowerCase() === 'profile updated' && (
            <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '4px' }}>
              by <strong style={{ color: '#2563eb' }}>{updatedBy.name}</strong>
              <span style={{ textTransform: 'capitalize', marginLeft: '2px' }}>
                ({updatedBy.role})
              </span>
            </span>
          )}
        </span>
      );
    }

    // Pattern 2: "Action: Name" (e.g., "New member: John Doe")
    const actionNameMatch = message.match(
      /^(New member|New class added|Class updated|Instructor added|Instructor updated|Schedule created|Schedule updated): (.+)$/i,
    );
    if (actionNameMatch) {
      const [, action, name] = actionNameMatch;
      return (
        <span>
          <strong>{action}:</strong> {name}
          {updatedBy && (
            <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '4px' }}>
              by <strong style={{ color: '#2563eb' }}>{updatedBy.name}</strong>
              <span style={{ textTransform: 'capitalize', marginLeft: '2px' }}>
                ({updatedBy.role})
              </span>
            </span>
          )}
        </span>
      );
    }

    // Pattern 3: "Announcement X" (e.g., "Announcement created: Title")
    const announcementMatch = message.match(
      /^(Announcement (?:created|published|deleted)): (.+)$/i,
    );
    if (announcementMatch) {
      const [, action, title] = announcementMatch;
      return (
        <span>
          <strong>{action}:</strong> {title}
          {updatedBy && (
            <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '4px' }}>
              by <strong style={{ color: '#2563eb' }}>{updatedBy.name}</strong>
              <span style={{ textTransform: 'capitalize', marginLeft: '2px' }}>
                ({updatedBy.role})
              </span>
            </span>
          )}
        </span>
      );
    }

    // Pattern 4: "Membership changed" patterns - enhanced to catch more variations
    const membershipMatch = message.match(/^(.+?) (membership changed to .+)$/i);
    if (membershipMatch) {
      const [, name, action] = membershipMatch;
      // Only process if name looks like a real name (not just "Member")
      const displayName = name.trim() !== 'Member' && name.trim() !== '' ? name : 'Member';
      return (
        <span>
          <strong>{displayName}</strong> {action}
          {updatedBy && (
            <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '4px' }}>
              by <strong style={{ color: '#2563eb' }}>{updatedBy.name}</strong>
              <span style={{ textTransform: 'capitalize', marginLeft: '2px' }}>
                ({updatedBy.role})
              </span>
            </span>
          )}
        </span>
      );
    }

    // Pattern 5: Delete actions (e.g., "Class deleted: CrossFit 101")
    const deleteMatch = message.match(
      /^(Class deleted|Instructor deleted|Schedule deleted): (.+)$/i,
    );
    if (deleteMatch) {
      const [, action, name] = deleteMatch;
      return (
        <span>
          <strong>{action}:</strong> {name}
          {updatedBy && (
            <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '4px' }}>
              by <strong style={{ color: '#2563eb' }}>{updatedBy.name}</strong>
              <span style={{ textTransform: 'capitalize', marginLeft: '2px' }}>
                ({updatedBy.role})
              </span>
            </span>
          )}
        </span>
      );
    }

    // Default: try to bold any names (capitalized words at start)
    const defaultMatch = message.match(/^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)*)/);
    if (defaultMatch) {
      const [, name] = defaultMatch;
      const rest = message.slice(name.length);
      return (
        <span>
          <strong>{name}</strong>
          {rest}
          {updatedBy && (
            <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '4px' }}>
              by <strong style={{ color: '#2563eb' }}>{updatedBy.name}</strong>
              <span style={{ textTransform: 'capitalize', marginLeft: '2px' }}>
                ({updatedBy.role})
              </span>
            </span>
          )}
        </span>
      );
    }

    // Fallback: return as-is
    return <span>{message}</span>;
  };

  const iconFor = (type: Activity['type']) => {
    switch (type) {
      case 'checkin':
        return { icon: '✅', cls: 'success' };
      case 'member_added':
        return { icon: '👤', cls: 'info' };
      case 'member_updated':
        return { icon: '🛠️', cls: 'info' };
      case 'membership_changed':
        return { icon: '💳', cls: 'warning' };
      case 'announcement_created':
        return { icon: '📝', cls: 'info' };
      case 'announcement_published':
        return { icon: '📢', cls: 'success' };
      case 'announcement_deleted':
        return { icon: '🗑️', cls: 'warning' };
      case 'birthday_upcoming':
        return { icon: '🎂', cls: 'birthday' };
      default:
        return { icon: 'ℹ️', cls: 'info' };
    }
  };

  const buildActivityFeed = (): Array<{
    id: string;
    type: Activity['type'];
    message: string;
    timestamp: string;
    updatedBy?: { name: string; role: string };
  }> => {
    const base: Array<{
      id: string;
      type: Activity['type'];
      message: string;
      timestamp: string;
      memberId?: string;
      updatedBy?: { name: string; role: string };
    }> = activities.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      timestamp: a.timestamp,
      memberId: a.memberId,
      updatedBy: a.updatedBy,
    }));
    // Synthesize upcoming birthday activities (next 7 days)
    const bdays = getUpcomingBirthdays();
    const bdayActs = bdays.map((m) => {
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

  // QR Scanner functions with real jsQR detection
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      setStream(mediaStream);
      setCameraActive(true);
      setScanResult(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Start continuous scanning when video starts playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startContinuousScanning();
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanResult({
        success: false,
        message: 'Camera access denied. Please allow camera permissions.',
      });
    }
  };

  const startContinuousScanning = () => {
    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = window.setInterval(() => {
      if (videoRef.current && canvasRef.current && cameraActive && !isScanning) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            // QR code detected!
            setIsScanning(true);
            processScan(code.data);
            stopContinuousScanning();
          }
        }
      }
    }, 300); // Scan every 300ms
  };

  const stopContinuousScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const stopCamera = () => {
    stopContinuousScanning();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setShowQRScanner(false);
  };

  const processScan = async (qrData: string) => {
    setIsScanning(true);
    stopCamera(); // Stop camera immediately when QR detected

    try {
      // Call backend API to verify QR code with membership limits
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4001/api/qr/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrCode: qrData }),
      });

      const result = await response.json();

      if (!response.ok) {
        setScanResult({
          success: false,
          message: result.error || 'QR verification failed',
        });
        setIsScanning(false);
        return;
      }

      if (result.valid && result.data) {
        // Show member review modal with all details
        setScannedMemberData(result.data);
        setShowMemberReview(true);
        setScanResult(null);
      } else {
        setScanResult({
          success: false,
          message: result.error || 'QR code verification failed',
        });
      }
    } catch (error: any) {
      console.error('QR verification error:', error);
      setScanResult({
        success: false,
        message: error.message || 'Failed to validate QR code with server',
      });
    }
    setIsScanning(false);
  };

  const handleConfirmCheckIn = async () => {
    if (!scannedMemberData) return;

    try {
      // Call backend to create check-in record
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4001/api/check-ins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: scannedMemberData.userId,
          qrCode: 'verified',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setScanResult({
          success: false,
          message: result.error || 'Check-in failed',
        });
        setShowMemberReview(false);
        return;
      }

      // Also update local state
      checkInMember(scannedMemberData.userId);

      // Show success message
      setScanResult({
        success: true,
        message: `Welcome back, ${scannedMemberData.firstName}! Check-in successful.`,
        member: scannedMemberData,
      });

      setShowMemberReview(false);
      setScannedMemberData(null);

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setScanResult(null);
      }, 5000);
    } catch (error: any) {
      console.error('Check-in error:', error);
      setScanResult({
        success: false,
        message: error.message || 'Failed to record check-in',
      });
      setShowMemberReview(false);
    }
  };

  const handleCancelCheckIn = () => {
    setShowMemberReview(false);
    setScannedMemberData(null);
    setScanResult(null);
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
        return <AnnouncementManager onBack={() => setActiveSection('dashboard')} user={user} />;
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
          <button className="btn btn-primary qr-scan-btn" onClick={handleQRScanClick}>
            <span className="icon">📱</span>
            <span className="btn-text">
              <strong>Scan Member QR</strong>
              <small>Check-in members quickly</small>
            </span>
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
                  <p>{formatActivityMessage(item.message, item.updatedBy)}</p>
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
                    style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="scanner-controls">
                    <p style={{ color: '#2ecc71', fontWeight: 'bold', marginTop: '10px' }}>
                      {isScanning ? '🔄 Scanning for QR codes...' : '📱 Scanning automatically...'}
                    </p>
                    <button className="btn btn-secondary" onClick={stopCamera}>
                      🛑 Stop Camera
                    </button>
                  </div>
                </div>
              )}

              {scanResult && (
                <div className="scan-result">
                  <div className={`result-message ${scanResult.success ? 'success' : 'error'}`}>
                    <h4>{scanResult.success ? '✅ Check-In Successful' : '❌ Check-In Failed'}</h4>
                    <p>{scanResult.message}</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setScanResult(null);
                      startCamera();
                      setShowQRScanner(true);
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

      {showMemberReview && scannedMemberData && (
        <div className="qr-scanner-modal">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Member Check-In Confirmation</h3>
              <button className="btn-close" onClick={handleCancelCheckIn}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="member-review-card">
                {scannedMemberData.avatarUrl && (
                  <div className="member-photo">
                    <img
                      src={scannedMemberData.avatarUrl}
                      alt={`${scannedMemberData.firstName}`}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        margin: '0 auto 20px',
                      }}
                    />
                  </div>
                )}

                <div
                  className="member-details"
                  style={{ textAlign: 'center', marginBottom: '20px' }}
                >
                  <h2 style={{ margin: '10px 0', color: '#2c3e50' }}>
                    {scannedMemberData.firstName} {scannedMemberData.lastName}
                  </h2>
                  <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                    {scannedMemberData.email}
                  </p>
                </div>

                <div
                  className="membership-info"
                  style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>Membership Type:</span>
                    <span style={{ color: '#3498db', fontWeight: '600' }}>
                      {scannedMemberData.membershipType || 'N/A'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>Status:</span>
                    <span
                      style={{
                        color:
                          scannedMemberData.membershipStatus === 'active' ? '#27ae60' : '#e74c3c',
                        fontWeight: '600',
                      }}
                    >
                      {scannedMemberData.membershipStatus === 'active' ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>Visits This Month:</span>
                    <span style={{ color: '#34495e', fontWeight: '600' }}>
                      {scannedMemberData.monthlyCheckInCount || 0}
                    </span>
                  </div>

                  {scannedMemberData.remainingVisits !== null &&
                    scannedMemberData.remainingVisits !== -1 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '12px',
                        }}
                      >
                        <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                          Remaining Visits:
                        </span>
                        <span
                          style={{
                            color: scannedMemberData.remainingVisits > 3 ? '#27ae60' : '#e67e22',
                            fontWeight: '600',
                          }}
                        >
                          {scannedMemberData.remainingVisits}
                        </span>
                      </div>
                    )}

                  {scannedMemberData.limitMessage && (
                    <div
                      style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: scannedMemberData.canCheckIn ? '#d4edda' : '#f8d7da',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${
                          scannedMemberData.canCheckIn ? '#28a745' : '#dc3545'
                        }`,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          color: scannedMemberData.canCheckIn ? '#155724' : '#721c24',
                        }}
                      >
                        {scannedMemberData.limitMessage}
                      </p>
                    </div>
                  )}
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
                  {scannedMemberData.canCheckIn ? (
                    <button
                      className="btn btn-success"
                      onClick={handleConfirmCheckIn}
                      style={{ flex: 1, padding: '12px 24px', fontSize: '16px', fontWeight: '600' }}
                    >
                      ✓ Confirm Check-In
                    </button>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#fff3cd',
                        border: '2px solid #ffc107',
                        borderRadius: '6px',
                        textAlign: 'center',
                      }}
                    >
                      <strong style={{ color: '#856404' }}>⚠️ Cannot Check-In</strong>
                      <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#856404' }}>
                        Monthly limit reached or membership expired
                      </p>
                    </div>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancelCheckIn}
                    style={{ flex: 1, padding: '12px 24px', fontSize: '16px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderActiveSection()}
    </div>
  );
};

export default Reception;
