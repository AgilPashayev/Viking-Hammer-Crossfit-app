import React, { useState, useRef, useEffect } from 'react';
import MemberManagement from './MemberManagement';
import CheckInHistory from './CheckInHistory';
import ClassManagement from './ClassManagement';
import AnnouncementManager from './AnnouncementManager';
import MembershipManager from './MembershipManager';
import UpcomingBirthdays from './UpcomingBirthdays';
import jsQR from 'jsqr';
import { useData, Activity } from '../contexts/DataContext';
import './Sparta.css';

interface SpartaProps {
  onNavigate?: (page: string) => void;
  user?: any;
}

const Sparta: React.FC<SpartaProps> = ({ onNavigate, user }) => {
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

  // Format activity messages with bold names and actions
  const formatActivityMessage = (message: string): React.ReactElement => {
    // Patterns to match:
    // "John Doe checked in" -> <strong>John Doe</strong> checked in
    // "New member: Jane Smith" -> New member: <strong>Jane Smith</strong>
    // "Class created: CrossFit 101" -> <strong>Class created:</strong> CrossFit 101
    // "Membership changed from X to Y" -> <strong>Membership changed</strong> from X to Y
    
    // Pattern 1: Name at the start (e.g., "John Doe checked in")
    const nameAtStartMatch = message.match(/^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)*) (checked in|profile updated|birthday upcoming)/i);
    if (nameAtStartMatch) {
      const [, name, action] = nameAtStartMatch;
      return <span><strong>{name}</strong> {action}</span>;
    }
    
    // Pattern 2: "Action: Name" (e.g., "New member: John Doe")
    const actionNameMatch = message.match(/^(New member|New class added|Class updated|Instructor added|Instructor updated|Schedule created|Schedule updated): (.+)$/i);
    if (actionNameMatch) {
      const [, action, name] = actionNameMatch;
      return <span><strong>{action}:</strong> {name}</span>;
    }
    
    // Pattern 3: "Announcement X" (e.g., "Announcement created: Title")
    const announcementMatch = message.match(/^(Announcement (?:created|published|deleted)): (.+)$/i);
    if (announcementMatch) {
      const [, action, title] = announcementMatch;
      return <span><strong>{action}:</strong> {title}</span>;
    }
    
    // Pattern 4: "Membership changed" patterns
    const membershipMatch = message.match(/^(Membership changed|Member status changed): (.+)$/i);
    if (membershipMatch) {
      const [, action, details] = membershipMatch;
      return <span><strong>{action}:</strong> {details}</span>;
    }
    
    // Pattern 5: Delete actions (e.g., "Class deleted: CrossFit 101")
    const deleteMatch = message.match(/^(Class deleted|Instructor deleted|Schedule deleted): (.+)$/i);
    if (deleteMatch) {
      const [, action, name] = deleteMatch;
      return <span><strong>{action}:</strong> {name}</span>;
    }
    
    // Default: try to bold any names (capitalized words at start)
    const defaultMatch = message.match(/^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)*)/);
    if (defaultMatch) {
      const [, name] = defaultMatch;
      const rest = message.slice(name.length);
      return <span><strong>{name}</strong>{rest}</span>;
    }
    
    // Fallback: return as-is
    return <span>{message}</span>;
  };

  const iconFor = (type: Activity['type']) => {
    switch (type) {
      case 'checkin': return { icon: '✅', cls: 'success' };
      case 'member_added': return { icon: '👤', cls: 'info' };
      case 'member_updated': return { icon: '🛠️', cls: 'info' };
      case 'membership_changed': return { icon: '💳', cls: 'warning' };
      case 'announcement_created': return { icon: '📝', cls: 'info' };
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
    setIsScanning(false);
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
    startCamera();
  };

  const handleCloseScanner = () => {
    setShowQRScanner(false);
    stopCamera();
    setScanResult(null);
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
          'Authorization': `Bearer ${token}`,
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
          'Authorization': `Bearer ${token}`,
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
      setShowQRScanner(false);

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

  const renderDashboard = () => {
    const feed = buildActivityFeed();
    const totalPages = Math.ceil(feed.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentActivities = feed.slice(startIdx, endIdx);

    return (
      <div className="sparta-dashboard">
        <div className="sparta-welcome">
          <div className="sparta-avatar">
            ⚔️
          </div>
          <div className="welcome-text">
            <h1>Sparta Dashboard</h1>
            <p className="subtitle">This is a SPARTAAA!!!</p>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="quick-actions-grid">
          <div className="action-card primary" onClick={() => setActiveSection('members')}>
            <div className="card-icon">👥</div>
            <div className="card-content">
              <h3>Manage Members</h3>
              <p>Add, edit, and view member profiles</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

          <div className="action-card secondary" onClick={() => setActiveSection('classes')}>
            <div className="card-icon">🏋️</div>
            <div className="card-content">
              <h3>Class Management</h3>
              <p>Schedule and manage fitness classes</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

          <div className="action-card success" onClick={handleScanQR}>
            <div className="card-icon">📱</div>
            <div className="card-content">
              <h3>QR Check-In</h3>
              <p>Scan member QR codes for check-in</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

          <div className="action-card warning" onClick={() => setActiveSection('memberships')}>
            <div className="card-icon">💳</div>
            <div className="card-content">
              <h3>Memberships</h3>
              <p>Manage subscriptions and billing</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

          <div className="action-card info" onClick={() => setActiveSection('announcements')}>
            <div className="card-icon">📢</div>
            <div className="card-content">
              <h3>Announcements</h3>
              <p>Create and manage gym announcements</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

          <div className="action-card purple" onClick={() => setActiveSection('birthdays')}>
            <div className="card-icon">🎂</div>
            <div className="card-content">
              <h3>Birthdays</h3>
              <p>View upcoming member birthdays</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

          <div className="action-card teal" onClick={() => setActiveSection('history')}>
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Check-In History</h3>
              <p>View member attendance records</p>
            </div>
            <div className="card-arrow">→</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="sparta-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalMembers}</div>
            <div className="stat-label">Total Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.checkedInToday}</div>
            <div className="stat-label">Check-ins Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏋️</div>
            <div className="stat-value">{stats.activeClasses}</div>
            <div className="stat-label">Active Classes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💪</div>
            <div className="stat-value">{stats.activeMembers}</div>
            <div className="stat-label">Active Memberships</div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="activity-section">
          <h2 className="section-title">📋 Recent Activity</h2>
          <div className="activity-feed">
            {currentActivities.length === 0 ? (
              <div className="no-activity">
                <div className="no-activity-icon">📭</div>
                <p>No recent activity</p>
              </div>
            ) : (
              currentActivities.map((activity) => {
                const { icon, cls } = iconFor(activity.type);
                return (
                  <div key={activity.id} className={`activity-item ${cls}`}>
                    <div className="activity-icon">{icon}</div>
                    <div className="activity-content">
                      <p className="activity-message">{formatActivityMessage(activity.message)}</p>
                      <span className="activity-time">{timeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="qr-scanner-modal">
            <div className="scanner-container">
              <div className="scanner-header">
                <h3>📱 Scan Member QR Code</h3>
                <button className="close-btn" onClick={handleCloseScanner}>
                  ✕
                </button>
              </div>
              <div className="scanner-content">
                {scanResult ? (
                  <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
                    <div className="result-icon">
                      {scanResult.success ? '✅' : '❌'}
                    </div>
                    <h4>{scanResult.message}</h4>
                    <button
                      className="capture-btn"
                      onClick={() => {
                        setScanResult(null);
                        startCamera();
                      }}
                    >
                      🔄 Scan Another
                    </button>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="scanner-video" />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="scanner-overlay">
                      <div className="scan-frame"></div>
                      <p style={{ color: '#2ecc71', fontWeight: 'bold', marginTop: '10px', textAlign: 'center' }}>
                        {isScanning ? '🔄 Scanning for QR codes...' : '📱 Scanning automatically...'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Member Review Modal */}
        {showMemberReview && scannedMemberData && (
          <div className="qr-scanner-modal">
            <div className="scanner-container" style={{ maxWidth: '500px' }}>
              <div className="scanner-header">
                <h3>Member Check-In Confirmation</h3>
                <button className="close-btn" onClick={handleCancelCheckIn}>
                  ✕
                </button>
              </div>
              <div className="scanner-content">
                <div className="member-review-card">
                  {scannedMemberData.avatarUrl && (
                    <div className="member-photo">
                      <img 
                        src={scannedMemberData.avatarUrl} 
                        alt={`${scannedMemberData.firstName}`}
                        style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 20px', display: 'block' }}
                      />
                    </div>
                  )}
                  
                  <div className="member-details" style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: '10px 0', color: '#2c3e50' }}>
                      {scannedMemberData.firstName} {scannedMemberData.lastName}
                    </h2>
                    <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                      {scannedMemberData.email}
                    </p>
                  </div>

                  <div className="membership-info" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>Membership Type:</span>
                      <span style={{ color: '#3498db', fontWeight: '600' }}>{scannedMemberData.membershipType || 'N/A'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>Status:</span>
                      <span style={{ color: scannedMemberData.membershipStatus === 'active' ? '#27ae60' : '#e74c3c', fontWeight: '600' }}>
                        {scannedMemberData.membershipStatus === 'active' ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>Visits This Month:</span>
                      <span style={{ color: '#34495e', fontWeight: '600' }}>{scannedMemberData.monthlyCheckInCount || 0}</span>
                    </div>

                    {scannedMemberData.remainingVisits !== null && scannedMemberData.remainingVisits !== -1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: '600', color: '#2c3e50' }}>Remaining Visits:</span>
                        <span style={{ color: scannedMemberData.remainingVisits > 3 ? '#27ae60' : '#e67e22', fontWeight: '600' }}>
                          {scannedMemberData.remainingVisits}
                        </span>
                      </div>
                    )}

                    {scannedMemberData.limitMessage && (
                      <div style={{ marginTop: '15px', padding: '12px', background: scannedMemberData.canCheckIn ? '#d4edda' : '#f8d7da', borderRadius: '6px', borderLeft: `4px solid ${scannedMemberData.canCheckIn ? '#28a745' : '#dc3545'}` }}>
                        <p style={{ margin: 0, fontSize: '14px', color: scannedMemberData.canCheckIn ? '#155724' : '#721c24' }}>
                          {scannedMemberData.limitMessage}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
                    {scannedMemberData.canCheckIn ? (
                      <button 
                        className="capture-btn" 
                        onClick={handleConfirmCheckIn}
                        style={{ flex: 1, padding: '12px 24px', fontSize: '16px', fontWeight: '600', background: '#28a745' }}
                      >
                        ✓ Confirm Check-In
                      </button>
                    ) : (
                      <div style={{ flex: 1, padding: '12px', background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '6px', textAlign: 'center' }}>
                        <strong style={{ color: '#856404' }}>⚠️ Cannot Check-In</strong>
                        <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#856404' }}>Monthly limit reached or membership expired</p>
                      </div>
                    )}
                    <button 
                      className="close-btn" 
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
      </div>
    );
  };

  const handleBackToDashboard = () => {
    setActiveSection('dashboard');
  };

  return (
    <div className="sparta">
      {activeSection === 'dashboard' && renderDashboard()}
      {activeSection === 'members' && (
        <MemberManagement onBack={handleBackToDashboard} />
      )}
      {activeSection === 'classes' && (
        <ClassManagement onBack={handleBackToDashboard} />
      )}
      {activeSection === 'history' && (
        <CheckInHistory onBack={handleBackToDashboard} />
      )}
      {activeSection === 'announcements' && (
        <AnnouncementManager onBack={handleBackToDashboard} user={user} />
      )}
      {activeSection === 'memberships' && (
        <MembershipManager onBack={handleBackToDashboard} />
      )}
      {activeSection === 'birthdays' && (
        <UpcomingBirthdays onBack={handleBackToDashboard} />
      )}
    </div>
  );
};

export default Sparta;
