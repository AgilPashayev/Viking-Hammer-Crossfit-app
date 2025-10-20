import React, { useState, useRef, useEffect } from 'react';
import MemberManagement from './MemberManagement';
import CheckInHistory from './CheckInHistory';
import ClassManagement from './ClassManagement';
import AnnouncementManager from './AnnouncementManager';
import MembershipManager from './MembershipManager';
import UpcomingBirthdays from './UpcomingBirthdays';
import { validateQRCode } from '../services/qrCodeService';
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
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
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

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Simulate QR code scanning (in real app, use a QR library)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Mock QR scanning - in production, use jsQR or similar
      setTimeout(() => {
        // Simulate successful scan
        const mockQRData = 'VH-DEMO-2024-' + Math.random().toString(36).substr(2, 9);
        const validation = validateQRCode(mockQRData);

        if (validation.valid && validation.memberId) {
          const member = members.find(m => m.id === validation.memberId);
          if (member) {
            checkInMember(member.id);
            setScanResult({
              success: true,
              member: member,
              message: 'Check-in successful!',
            });
          } else {
            setScanResult({
              success: false,
              message: 'Member not found',
            });
          }
        } else {
          setScanResult({
            success: false,
            message: validation.error || 'Invalid QR code',
          });
        }

        setIsScanning(false);
        setTimeout(() => {
          handleCloseScanner();
        }, 2000);
      }, 1000);
    }
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
            <div className="stat-value">{stats.checkInsToday}</div>
            <div className="stat-label">Check-ins Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏋️</div>
            <div className="stat-value">{stats.activeClasses}</div>
            <div className="stat-label">Active Classes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💪</div>
            <div className="stat-value">{stats.activeMemberships}</div>
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
                      <p className="activity-message">{activity.message}</p>
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
                    {scanResult.member && (
                      <div className="member-info">
                        <p>
                          <strong>
                            {scanResult.member.firstName} {scanResult.member.lastName}
                          </strong>
                        </p>
                        <p>{scanResult.member.membershipType}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="scanner-video" />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="scanner-overlay">
                      <div className="scan-frame"></div>
                    </div>
                    <button
                      className="capture-btn"
                      onClick={handleCapture}
                      disabled={isScanning || !cameraActive}
                    >
                      {isScanning ? '⏳ Scanning...' : '📸 Capture & Scan'}
                    </button>
                  </>
                )}
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
