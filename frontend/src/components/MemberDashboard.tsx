import React, { useState, useEffect } from 'react';
import './MemberDashboard.css';
import { useData } from '../contexts/DataContext';
import { classService, GymClass } from '../services/classManagementService';
import { bookingService } from '../services/bookingService';
import ClassDetailsModal from './ClassDetailsModal';
import {
  generateQRCodeData,
  generateQRCodeImage,
  storeQRCode,
  getUserQRCode,
  QRCodeData,
} from '../services/qrCodeService';
import { pushNotificationService } from '../services/pushNotificationService';
import AnnouncementPopup from './AnnouncementPopup';
import { useAnnouncements } from '../hooks/useAnnouncements';

interface UserProfile {
  name: string;
  membershipType: string;
  joinDate: string;
  visitsThisMonth: number;
  totalVisits: number;
  avatar?: string;
}

interface ClassBooking {
  id: string;
  className: string;
  instructor: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'warning' | 'success';
  readBy?: string[];
}

interface MemberDashboardProps {
  onNavigate?: (page: string) => void;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    countryCode?: string;
    dateOfBirth?: string;
    gender?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactCountryCode?: string;
    membershipType: string;
    joinDate: string;
    isAuthenticated: boolean;
  } | null;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ onNavigate, user }) => {
  const { getMemberVisitsThisMonth, getMemberTotalVisits, classes } = useData();
  
  // Calculate real-time visit statistics
  const visitsThisMonth = user?.id ? getMemberVisitsThisMonth(user.id) : 0;
  const totalVisits = user?.id ? getMemberTotalVisits(user.id) : 0;
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user ? `${user.firstName} ${user.lastName}` : 'Viking Warrior',
    membershipType: user?.membershipType || 'Viking Warrior Basic',
    joinDate: user?.joinDate || new Date().toISOString(),
    visitsThisMonth: visitsThisMonth,
    totalVisits: totalVisits,
    avatar: (user as any)?.avatar_url || (user as any)?.profilePhoto || undefined,
  });

  const [localClasses, setLocalClasses] = useState(classes);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [selectedClassDate, setSelectedClassDate] = useState<string>('');
  const [selectedClassTime, setSelectedClassTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [userBookings, setUserBookings] = useState<string[]>([]);
  const [bookingMessage, setBookingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user bookings
  useEffect(() => {
    const loadUserBookings = async () => {
      if (user?.id) {
        const bookings = await bookingService.getMemberBookings(user.id);
        const bookingKeys = bookings.map(b => `${b.classId}-${b.date}-${b.startTime}`);
        setUserBookings(bookingKeys);
      }
    };
    loadUserBookings();
  }, [user?.id]);

  // Load classes from API on mount and when changes occur
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setIsLoadingClasses(true);
        const classesData = await classService.getAll();
        setLocalClasses(classesData);
      } catch (error) {
        console.error('Failed to load classes:', error);
        // Fall back to context classes if API fails
        setLocalClasses(classes);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    loadClasses();

    // Set up polling to check for updates every 30 seconds
    const pollInterval = setInterval(loadClasses, 30000);

    return () => clearInterval(pollInterval);
  }, [classes]);

  // Update user profile when user data changes OR when visits change
  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`,
        membershipType: user.membershipType,
        joinDate: user.joinDate,
        visitsThisMonth: getMemberVisitsThisMonth(user.id),
        totalVisits: getMemberTotalVisits(user.id),
        avatar: (user as any)?.avatar_url || (user as any)?.profilePhoto || prev.avatar,
      }));
    }
  }, [user, getMemberVisitsThisMonth, getMemberTotalVisits]);

  // Transform classes to ClassBooking format with real-time updates
  const upcomingClasses: ClassBooking[] = localClasses
    .filter(cls => cls.status === 'active' && cls.schedule && cls.schedule.length > 0)
    .map(cls => {
      // Find next scheduled class
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5);
      
      // Find the next upcoming schedule slot
      let nextSchedule = cls.schedule.find(sch => {
        if (sch.dayOfWeek === currentDay) {
          return sch.startTime > currentTime;
        }
        return sch.dayOfWeek > currentDay;
      });

      // If no schedule found this week, get first schedule slot (next week)
      if (!nextSchedule) {
        nextSchedule = cls.schedule.sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];
      }

      // Calculate next date for this class
      const targetDay = nextSchedule.dayOfWeek;
      let daysUntilClass = targetDay - currentDay;
      if (daysUntilClass <= 0 || (daysUntilClass === 0 && nextSchedule.startTime <= currentTime)) {
        daysUntilClass += 7;
      }
      
      const nextDate = new Date();
      nextDate.setDate(now.getDate() + daysUntilClass);

      return {
        id: cls.id,
        className: cls.name,
        instructor: cls.instructors && cls.instructors.length > 0 ? cls.instructors[0] : 'TBA',
        date: nextDate.toISOString().split('T')[0],
        time: nextSchedule.startTime,
        status: 'upcoming' as const,
      };
    })
    .sort((a, b) => {
      // Sort by date and time
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 5); // Show only next 5 upcoming classes

  // Use announcements hook
  const {
    announcements: announcementsList,
    unreadAnnouncements,
    showPopup: showAnnouncementPopup,
    isMarking: isMarkingAnnouncements,
    handleClosePopup: handleCloseAnnouncementPopup,
  } = useAnnouncements({
    userId: user?.id,
    role: 'member',
    enabled: true,
  });

  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);

  // Initialize push notifications
  useEffect(() => {
    const initPushNotifications = async () => {
      if (!user?.id) return;

      // Check if notifications are supported
      if (pushNotificationService.isSupported()) {
        const permission = pushNotificationService.getPermissionStatus();
        setPushNotificationsEnabled(permission.granted);

        // If permission is granted, ensure subscription
        if (permission.granted) {
          try {
            await pushNotificationService.subscribe(user.id);
          } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
          }
        }
      }
    };

    initPushNotifications();
  }, [user?.id]);

  // Request push notification permission
  const handleEnablePushNotifications = async () => {
    if (!user?.id) return;

    try {
      const granted = await pushNotificationService.requestPermission();
      if (granted) {
        await pushNotificationService.subscribe(user.id);
        setPushNotificationsEnabled(true);
        
        // Show test notification
        await pushNotificationService.showNotification(
          'Notifications Enabled! 🎉',
          {
            body: 'You will now receive updates about gym announcements and classes.',
          }
        );
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
    }
  };

  const [quickStats, setQuickStats] = useState({
    nextClass: 'CrossFit WOD - Tomorrow 6:00 AM',
    membershipExpiry: '2025-11-15',
    qrCode: 'VH-JV-2024-001',
  });

  // QR Code state management
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [qrCodeImage, setQRCodeImage] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Booking handlers
  const handleShowDetails = (classItem: any) => {
    const gymClass = localClasses.find(c => c.id === classItem.id);
    if (gymClass) {
      setSelectedClass(gymClass);
      setSelectedClassDate(classItem.date);
      setSelectedClassTime(classItem.time);
    }
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
    setSelectedClassDate('');
    setSelectedClassTime('');
    setBookingMessage(null);
  };

  const handleBookClass = async () => {
    if (!selectedClass || !user?.id) return;

    const bookingKey = `${selectedClass.id}-${selectedClassDate}-${selectedClassTime}`;
    const isAlreadyBooked = userBookings.includes(bookingKey);

    try {
      setIsBooking(true);
      
      if (isAlreadyBooked) {
        // Cancel booking
        const result = await bookingService.cancelBooking(
          selectedClass.id,
          user.id,
          selectedClassDate,
          selectedClassTime
        );

        if (result.success) {
          setUserBookings(prev => prev.filter(key => key !== bookingKey));
          setBookingMessage({ type: 'success', text: 'Booking cancelled successfully!' });
          
          // Refresh classes to update enrollment
          const classesData = await classService.getAll();
          setLocalClasses(classesData);
          
          setTimeout(handleCloseModal, 2000);
        } else {
          setBookingMessage({ type: 'error', text: result.message || 'Failed to cancel booking' });
        }
      } else {
        // Book class
        const result = await bookingService.bookClass(
          selectedClass.id,
          user.id,
          selectedClassDate,
          selectedClassTime
        );

        if (result.success) {
          setUserBookings(prev => [...prev, bookingKey]);
          setBookingMessage({ type: 'success', text: 'Class booked successfully!' });
          
          // Refresh classes to update enrollment
          const classesData = await classService.getAll();
          setLocalClasses(classesData);
          
          setTimeout(handleCloseModal, 2000);
        } else {
          setBookingMessage({ type: 'error', text: result.message || 'Failed to book class' });
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsBooking(false);
    }
  };

  // QR Code generation function
  const generateNewQRCode = async () => {
    if (!user) return;

    try {
      setIsGeneratingQR(true);

      // Generate new QR code data
      const newQRData = generateQRCodeData(
        user.id || user.email, // Use ID or email as userId
        user.email,
        user.membershipType || 'Viking Warrior Basic',
      );

      // Generate QR code image
      const qrImage = await generateQRCodeImage(newQRData);

      // Store in localStorage for demo mode
      storeQRCode(user.id || user.email, newQRData);

      // Update state
      setQRCodeData(newQRData);
      setQRCodeImage(qrImage);

      // Update quickStats to show new QR ID
      setQuickStats((prev) => ({
        ...prev,
        qrCode: newQRData.checkInId,
      }));

      console.log('New QR code generated:', newQRData.checkInId);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Load existing QR code or generate new one
  const loadOrGenerateQRCode = async () => {
    if (!user) return;

    const userId = user.id || user.email;
    const existingQR = getUserQRCode(userId);

    if (existingQR) {
      // Use existing valid QR code
      try {
        const qrImage = await generateQRCodeImage(existingQR);
        setQRCodeData(existingQR);
        setQRCodeImage(qrImage);
        setQuickStats((prev) => ({
          ...prev,
          qrCode: existingQR.checkInId,
        }));
        console.log('Loaded existing QR code:', existingQR.checkInId);
      } catch (error) {
        console.error('Failed to regenerate QR image:', error);
        // Generate new QR if image generation fails
        generateNewQRCode();
      }
    } else {
      // Generate new QR code
      generateNewQRCode();
    }
  };

  // Auto-generate QR code when user changes
  useEffect(() => {
    if (user) {
      loadOrGenerateQRCode();
    }
  }, [user]);

  const handleGenerateQR = () => {
    // Show QR modal and generate/load QR code
    setShowQRModal(true);
    if (!qrCodeData) {
      loadOrGenerateQRCode();
    }
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
  };

  const handleRegenerateQR = () => {
    // Generate new QR code for check-in
    generateNewQRCode();
  };

  return (
    <div className="member-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="user-welcome">
          <div className="user-avatar">
            <img 
              src={userProfile.avatar || "/api/placeholder/60/60"} 
              alt="User Avatar" 
              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div className="welcome-text">
            <h1>Welcome back, {userProfile.name}!</h1>
            <p className="membership-info">
              {userProfile.membershipType} • Member since{' '}
              {new Date(userProfile.joinDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary qr-code-btn" onClick={handleGenerateQR}>
            <span className="icon">📱</span>
            <span className="btn-text">
              <strong>My QR Code</strong>
              <small>Tap to show your check-in code</small>
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏃‍♂️</div>
          <div className="stat-content">
            <h3>{userProfile.visitsThisMonth}</h3>
            <p>Visits This Month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💪</div>
          <div className="stat-content">
            <h3>{userProfile.totalVisits}</h3>
            <p>Total Visits</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{upcomingClasses.length}</h3>
            <p>Upcoming Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Active</h3>
            <p>Membership Status</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Upcoming Classes */}
        <div className="content-section">
          <div className="section-header">
            <h2>🗓️ Upcoming Classes</h2>
            {isLoadingClasses && <span className="loading-indicator">🔄 Refreshing...</span>}
            <button className="btn btn-link">
              View All
            </button>
          </div>
          <div className="classes-list">
            {upcomingClasses.length === 0 ? (
              <div className="no-classes">
                <div className="no-classes-icon">�</div>
                <p>No upcoming classes scheduled</p>
                <small>Check back later or contact your instructor</small>
              </div>
            ) : (
              upcomingClasses.map((classItem) => {
                const bookingKey = `${classItem.id}-${classItem.date}-${classItem.time}`;
                const isBooked = userBookings.includes(bookingKey);
                
                return (
                  <div key={`${classItem.id}-${classItem.date}-${classItem.time}`} className="class-card">
                    <div className="class-info">
                      <h4>{classItem.className}</h4>
                      <p className="instructor">with {classItem.instructor}</p>
                      <div className="class-datetime">
                        <span className="date">
                          📅 {new Date(classItem.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="time">🕐 {classItem.time}</span>
                      </div>
                    </div>
                    <div className="class-actions">
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleShowDetails(classItem)}
                      >
                        Details
                      </button>
                      <button 
                        className={`btn ${isBooked ? 'btn-success' : 'btn-primary'}`}
                        onClick={() => handleShowDetails(classItem)}
                      >
                        {isBooked ? '✅ Booked' : 'Book'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Gym Announcements */}
        <div className="content-section full-width">
          <div className="section-header">
            <h2>📢 Gym News & Announcements</h2>
          </div>
          <div className="announcements-list">
            {announcementsList.map((announcement: Announcement) => (
              <div key={announcement.id} className={`announcement-card ${announcement.type}`}>
                <div className="announcement-header">
                  <h4>{announcement.title}</h4>
                  <span className="announcement-date">
                    {new Date(announcement.date).toLocaleDateString()}
                  </span>
                </div>
                <p>{announcement.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="qr-modal-overlay" onClick={handleCloseQRModal}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>🎫 Your Check-In QR Code</h3>
              <button className="close-button" onClick={handleCloseQRModal}>
                ✕
              </button>
            </div>
            <div className="qr-modal-content">
              <div className="qr-display">
                {qrCodeImage ? (
                  <img
                    src={qrCodeImage}
                    alt="Check-in QR Code"
                    className="qr-code-image"
                  />
                ) : (
                  <div className="qr-loading">
                    {isGeneratingQR ? (
                      <div className="loading-content">
                        <div className="spinner">🔄</div>
                        <p>Generating QR Code...</p>
                      </div>
                    ) : (
                      <div className="qr-pattern"></div>
                    )}
                  </div>
                )}
              </div>
              <div className="qr-info">
                <p className="qr-instruction">Present this QR code to the receptionist to check in</p>
                <p className="qr-id">ID: {quickStats.qrCode}</p>
                {qrCodeData && (
                  <div className="qr-details">
                    <p>Expires: {new Date(qrCodeData.expiresAt).toLocaleDateString()}</p>
                    <p>Generated: {new Date(qrCodeData.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="qr-actions">
                <button
                  onClick={handleRegenerateQR}
                  disabled={isGeneratingQR}
                  className="btn btn-secondary"
                >
                  {isGeneratingQR ? 'Generating...' : 'Generate New QR'}
                </button>
                <button onClick={handleCloseQRModal} className="btn btn-primary">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {selectedClass && (
        <ClassDetailsModal
          gymClass={selectedClass}
          selectedDate={selectedClassDate}
          selectedTime={selectedClassTime}
          onClose={handleCloseModal}
          onBook={handleBookClass}
          isBooked={userBookings.includes(`${selectedClass.id}-${selectedClassDate}-${selectedClassTime}`)}
          isBooking={isBooking}
        />
      )}

      {/* Booking Message Toast */}
      {bookingMessage && (
        <div className={`booking-toast ${bookingMessage.type}`}>
          {bookingMessage.type === 'success' ? '✅' : '❌'} {bookingMessage.text}
        </div>
      )}

      {/* Announcement Popup */}
      {showAnnouncementPopup && (
        <AnnouncementPopup
          announcements={unreadAnnouncements}
          onClose={handleCloseAnnouncementPopup}
          isLoading={isMarkingAnnouncements}
        />
      )}
    </div>
  );
};

export default MemberDashboard;
