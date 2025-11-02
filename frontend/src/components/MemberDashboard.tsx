import React, { useState, useEffect } from 'react';
import './MemberDashboard.css';
import { useData } from '../contexts/DataContext';
import { classService, GymClass } from '../services/classManagementService';
import { bookingService } from '../services/bookingService';
import ClassDetailsModal from './ClassDetailsModal';
import { formatDate } from '../utils/dateFormatter';
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
  const { getMemberVisitsThisMonth, getMemberTotalVisits, classes, members, checkIns } = useData();

  // Debug logging
  console.log('MemberDashboard rendering, user:', user);

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
  const [selectedClassDayOfWeek, setSelectedClassDayOfWeek] = useState<number | undefined>(
    undefined,
  );
  const [isBooking, setIsBooking] = useState(false);
  const [userBookings, setUserBookings] = useState<string[]>([]);
  const [bookingMessage, setBookingMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Confirmation modal state for announcement dismiss
  const [dismissConfirmModal, setDismissConfirmModal] = useState<{
    show: boolean;
    announcementId: string;
    title: string;
  }>({ show: false, announcementId: '', title: '' });

  // Helper function to normalize time format to HH:MM:SS for consistent comparison
  const normalizeTime = (time: string): string => {
    if (!time) return '';
    // If time is HH:MM, convert to HH:MM:SS (database format)
    return time.length === 5 ? `${time}:00` : time;
  };

  // Helper function to get day of week from date string (YYYY-MM-DD)
  const getDayOfWeek = (dateString: string): number => {
    // Parse date components to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay();
  };

  // Load user bookings
  useEffect(() => {
    const loadUserBookings = async () => {
      if (user?.id) {
        const bookings = await bookingService.getMemberBookings(user.id);
        console.log('📋 Loaded user bookings (raw):', JSON.stringify(bookings, null, 2));
        // Parse backend response format: booking.slot.class.id, booking.booking_date, booking.slot.start_time
        const bookingKeys = bookings.map((b: any) => {
          const classId = b.slot?.class?.id || b.classId;
          const date = b.booking_date || b.date;
          const startTime = normalizeTime(b.slot?.start_time || b.startTime);
          const key = `${classId}-${date}-${startTime}`;
          console.log(`  📝 Booking ${b.id}:`);
          console.log(`     classId: "${classId}"`);
          console.log(`     date: "${date}"`);
          console.log(`     startTime: "${startTime}"`);
          console.log(`     => key: "${key}"`);
          return key;
        });
        console.log('🔑 Final booking keys array:', bookingKeys);
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
  }, []); // Empty dependency - only load on mount and poll

  // Sync localClasses with DataContext classes when they change
  useEffect(() => {
    setLocalClasses(classes);
  }, [classes]);

  // Helper function to get instructor name by ID or from class data
  const getInstructorName = (instructorId: string, classData?: any): string => {
    // First try to find instructor in members data (available for admins)
    const instructor = members.find(
      (member) => member.id === instructorId && member.role === 'instructor',
    );

    if (instructor) {
      return `${instructor.firstName} ${instructor.lastName}`;
    }

    // Try to get instructor name from class data if available
    if (classData && classData.instructorNames && classData.instructorNames.length > 0) {
      const instructorIndex = classData.instructors?.indexOf(instructorId) ?? -1;
      if (instructorIndex >= 0 && classData.instructorNames[instructorIndex]) {
        return classData.instructorNames[instructorIndex];
      }
      // If instructor ID not found in array, return the first instructor name
      return classData.instructorNames[0];
    }

    // Fallback for regular members: return a user-friendly placeholder
    if (instructorId && instructorId.length > 10) {
      return 'Instructor'; // Generic placeholder for valid instructor IDs
    }

    return instructorId || 'TBA';
  };

  // Helper function to get full member data including status
  const getFullMemberData = () => {
    if (!user?.id) return null;
    return members.find((member) => member.id === user.id);
  };

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
  }, [user, getMemberVisitsThisMonth, getMemberTotalVisits, checkIns, members]);

  // Transform classes to ClassBooking format with real-time updates
  const upcomingClasses: ClassBooking[] = localClasses
    .filter((cls) => cls.status === 'active' && cls.schedule && cls.schedule.length > 0)
    .map((cls) => {
      try {
        // Find next scheduled class
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.toTimeString().slice(0, 5);

        // Find the next upcoming schedule slot
        let nextSchedule = cls.schedule.find((sch) => {
          if (sch.dayOfWeek === currentDay) {
            return sch.startTime > currentTime;
          }
          return sch.dayOfWeek > currentDay;
        });

        // If no schedule found this week, get first schedule slot (next week)
        if (!nextSchedule && cls.schedule.length > 0) {
          nextSchedule = [...cls.schedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];
        }

        // Safety check: if still no schedule, return null to filter out
        if (!nextSchedule || nextSchedule.dayOfWeek == null || !nextSchedule.startTime) {
          return null;
        }

        // Calculate next date for this class
        const targetDay = nextSchedule.dayOfWeek;
        let daysUntilClass = targetDay - currentDay;
        if (
          daysUntilClass <= 0 ||
          (daysUntilClass === 0 && nextSchedule.startTime <= currentTime)
        ) {
          daysUntilClass += 7;
        }

        const nextDate = new Date();
        nextDate.setDate(now.getDate() + daysUntilClass);

        // Validate the date before converting to ISO string
        if (isNaN(nextDate.getTime())) {
          console.error('Invalid date calculated for class:', cls.name);
          return null;
        }

        const booking: ClassBooking = {
          id: cls.id,
          className: cls.name,
          instructor:
            cls.instructors && cls.instructors.length > 0
              ? getInstructorName(cls.instructors[0], cls)
              : 'TBA',
          date: nextDate.toISOString().split('T')[0],
          time: normalizeTime(nextSchedule.startTime), // Normalize time format
          status: 'upcoming',
        };

        // DEBUG: Log the booking key that will be used
        const debugKey = `${cls.id}-${booking.date}-${booking.time}`;
        console.log(
          `🗓️ Upcoming class "${cls.name}": key="${debugKey}", date="${booking.date}", time="${booking.time}"`,
        );

        return booking;
      } catch (error) {
        console.error('Error processing class:', cls.name, error);
        return null;
      }
    })
    .filter((cls): cls is ClassBooking => cls !== null)
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
    dismissAnnouncement,
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
        await pushNotificationService.showNotification('Notifications Enabled! 🎉', {
          body: 'You will now receive updates about gym announcements and classes.',
        });
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
    const gymClass = localClasses.find((c) => c.id === classItem.id);
    if (gymClass) {
      setSelectedClass(gymClass);
      setSelectedClassDate(classItem.date);
      setSelectedClassTime(classItem.time);

      // Calculate dayOfWeek from the date to ensure correct matching with database
      const calculatedDayOfWeek = getDayOfWeek(classItem.date);
      setSelectedClassDayOfWeek(calculatedDayOfWeek);

      console.log('🔍 Class Details Modal - Setting:', {
        date: classItem.date,
        time: classItem.time,
        calculatedDayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
          calculatedDayOfWeek
        ],
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
    setSelectedClassDate('');
    setSelectedClassTime('');
    setSelectedClassDayOfWeek(undefined);
    setBookingMessage(null);
  };

  const handleBookClass = async () => {
    if (!selectedClass || !user?.id) return;

    const normalizedTime = normalizeTime(selectedClassTime);
    const bookingKey = `${selectedClass.id}-${selectedClassDate}-${normalizedTime}`;
    const isAlreadyBooked = userBookings.includes(bookingKey);

    console.log('🎯 BOOKING ACTION DEBUG:');
    console.log('  Selected Class ID:', selectedClass.id);
    console.log('  Selected Date:', selectedClassDate, typeof selectedClassDate);
    console.log('  Selected Time (original):', selectedClassTime);
    console.log('  Selected Time (normalized):', normalizedTime);
    console.log('  Generated Key:', bookingKey);
    console.log('  Is Already Booked?', isAlreadyBooked);
    console.log('  Current userBookings:', userBookings);

    try {
      setIsBooking(true);

      if (isAlreadyBooked) {
        // Cancel booking - first find the booking ID
        console.log('🔍 CANCEL BOOKING DEBUG:');
        console.log('  Looking for booking with key:', bookingKey);
        console.log('  Current userBookings:', userBookings);

        const bookings = await bookingService.getMemberBookings(user.id);
        console.log('  Fetched bookings from backend:', bookings);

        const bookingToCancel = bookings.find((b: any) => {
          const classId = b.slot?.class?.id || b.classId;
          const date = b.booking_date || b.date;
          const startTime = normalizeTime(b.slot?.start_time || b.startTime);
          const testKey = `${classId}-${date}-${startTime}`;
          console.log(
            `  Testing booking ${b.id}: ${testKey} === ${bookingKey}?`,
            testKey === bookingKey,
          );
          return testKey === bookingKey;
        });

        if (!bookingToCancel) {
          console.error('❌ CANCEL FAILED: Booking not found in database');
          console.error('  Searched for key:', bookingKey);
          console.error(
            '  Available bookings:',
            bookings.map((b: any) => ({
              id: b.id,
              key: `${b.slot?.class?.id || b.classId}-${b.booking_date || b.date}-${normalizeTime(
                b.slot?.start_time || b.startTime,
              )}`,
            })),
          );
          setBookingMessage({
            type: 'error',
            text: 'Booking not found in database. Please refresh the page.',
          });
          setIsBooking(false);
          return;
        }

        console.log('✅ Found booking to cancel:', bookingToCancel);

        const result = await bookingService.cancelBooking(
          (bookingToCancel as any).id, // Use the actual booking ID
          user.id,
          selectedClassDate,
          selectedClassTime,
        );

        if (result.success) {
          setBookingMessage({ type: 'success', text: 'Booking cancelled successfully!' });

          // Reload user bookings from backend
          const updatedBookings = await bookingService.getMemberBookings(user.id);
          const bookingKeys = updatedBookings.map((b: any) => {
            const classId = b.slot?.class?.id || b.classId;
            const date = b.booking_date || b.date;
            const startTime = normalizeTime(b.slot?.start_time || b.startTime);
            return `${classId}-${date}-${startTime}`;
          });
          console.log('📋 Updated booking keys after cancel:', bookingKeys);
          setUserBookings(bookingKeys);

          // Refresh classes to update enrollment
          const classesData = await classService.getAll();
          setLocalClasses(classesData);

          setTimeout(handleCloseModal, 2000);
        } else {
          setBookingMessage({ type: 'error', text: result.message || 'Failed to cancel booking' });
        }
      } else {
        // Book class
        console.log('📝 CREATE BOOKING DEBUG:');
        console.log('  classId:', selectedClass.id);
        console.log('  bookingDate:', selectedClassDate);
        console.log('  startTime:', selectedClassTime);
        console.log('  dayOfWeek:', selectedClassDayOfWeek);

        const result = await bookingService.bookClass(
          selectedClass.id,
          user.id,
          selectedClassDate,
          selectedClassTime,
          selectedClassDayOfWeek, // Pass the pre-calculated dayOfWeek
        );

        console.log('📝 Booking result:', result);

        if (result.success) {
          setBookingMessage({ type: 'success', text: 'Class booked successfully!' });

          // Reload user bookings from backend
          const updatedBookings = await bookingService.getMemberBookings(user.id);
          console.log('📋 Bookings after create:', updatedBookings);

          const bookingKeys = updatedBookings.map((b: any) => {
            const classId = b.slot?.class?.id || b.classId;
            const date = b.booking_date || b.date;
            const startTime = normalizeTime(b.slot?.start_time || b.startTime);
            const key = `${classId}-${date}-${startTime}`;
            console.log(`  Creating booking key: ${key}`, b);
            return key;
          });
          console.log('📋 Updated booking keys after book:', bookingKeys);
          setUserBookings(bookingKeys);

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
              src={userProfile.avatar || '/api/placeholder/60/60'}
              alt="User Avatar"
              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div className="welcome-text">
            <h1>Welcome back, {userProfile.name}!</h1>
            <p className="membership-info">
              {userProfile.membershipType} • Member since {formatDate(userProfile.joinDate)}
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
            <h3>
              {(() => {
                const memberData = getFullMemberData();
                const status = memberData?.status || 'active';
                return status.charAt(0).toUpperCase() + status.slice(1);
              })()}
            </h3>
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
            <button className="btn btn-link" onClick={() => onNavigate?.('classes')}>
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
                  <div
                    key={`${classItem.id}-${classItem.date}-${classItem.time}`}
                    className="class-card"
                  >
                    <div className="class-info">
                      <h4>{classItem.className}</h4>
                      <p className="instructor">with {classItem.instructor}</p>
                      <div className="class-datetime">
                        <span className="date">
                          📅{' '}
                          {new Date(classItem.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
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
            {announcementsList.length === 0 ? (
              <div className="empty-state">
                <p>📭 No announcements at the moment. Check back later!</p>
              </div>
            ) : (
              announcementsList.map((announcement: Announcement) => (
                <div key={announcement.id} className={`announcement-card ${announcement.type}`}>
                  <div className="announcement-header">
                    <h4>{announcement.title}</h4>
                    <div className="announcement-actions">
                      <span className="announcement-date">{formatDate(announcement.date)}</span>
                      <button
                        className="btn-dismiss"
                        onClick={() => {
                          setDismissConfirmModal({
                            show: true,
                            announcementId: announcement.id,
                            title: announcement.title,
                          });
                        }}
                        title="Dismiss announcement"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p>{announcement.message}</p>
                </div>
              ))
            )}
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
                  <img src={qrCodeImage} alt="Check-in QR Code" className="qr-code-image" />
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
                <p className="qr-instruction">
                  Present this QR code to the receptionist to check in
                </p>
                <p className="qr-id">ID: {quickStats.qrCode}</p>
                {qrCodeData && (
                  <div className="qr-details">
                    <p>Expires: {formatDate(qrCodeData.expiresAt)}</p>
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
          isBooked={userBookings.includes(
            `${selectedClass.id}-${selectedClassDate}-${selectedClassTime}`,
          )}
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

      {/* Dismiss Announcement Confirmation Modal */}
      {dismissConfirmModal.show && (
        <div
          className="modal-overlay"
          onClick={() => setDismissConfirmModal({ show: false, announcementId: '', title: '' })}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📢 Dismiss Announcement</h3>
              <button
                className="modal-close-btn"
                onClick={() =>
                  setDismissConfirmModal({ show: false, announcementId: '', title: '' })
                }
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                Are you sure you want to dismiss "<strong>{dismissConfirmModal.title}</strong>"?
              </p>
              <p className="modal-submessage">
                This announcement will be marked as read and removed from your dashboard.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() =>
                  setDismissConfirmModal({ show: false, announcementId: '', title: '' })
                }
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const success = await dismissAnnouncement(dismissConfirmModal.announcementId);
                  setDismissConfirmModal({ show: false, announcementId: '', title: '' });
                  if (!success) {
                    alert('❌ Failed to dismiss announcement. Please try again.');
                  }
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;
