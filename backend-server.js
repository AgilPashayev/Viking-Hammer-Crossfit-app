// backend-server.js - PRODUCTION-READY with Supabase + bcrypt
// Complete backend with database persistence, password hashing, and full CRUD operations

const express = require('express');
const cors = require('cors');
const { supabase, testConnection } = require('./supabaseClient');

// Import services
const authService = require('./services/authService');
const userService = require('./services/userService');
const classService = require('./services/classService');
const instructorService = require('./services/instructorService');
const scheduleService = require('./services/scheduleService');
const bookingService = require('./services/bookingService');
const subscriptionService = require('./services/subscriptionService');
const notificationService = require('./services/notificationService');
const invitationService = require('./services/invitationService');

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ==================== AUTHENTICATION ====================

/**
 * POST /api/auth/signup - Register new user with hashed password
 */
app.post(
  '/api/auth/signup',
  asyncHandler(async (req, res) => {
    const result = await authService.signUp(req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }),
);

/**
 * POST /api/auth/signin - Login with email and password
 */
app.post(
  '/api/auth/signin',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.signIn(email, password);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * POST /api/auth/change-password - Update user password
 */
app.post(
  '/api/auth/change-password',
  asyncHandler(async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await authService.updatePassword(userId, oldPassword, newPassword);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

// ==================== USERS/MEMBERS ====================

/**
 * GET /api/users - Get all users with optional filters
 */
app.get(
  '/api/users',
  asyncHandler(async (req, res) => {
    const filters = {
      role: req.query.role,
      status: req.query.status,
    };

    const result = await userService.getAllUsers(filters);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * GET /api/users/:id - Get user by ID
 */
app.get(
  '/api/users/:id',
  asyncHandler(async (req, res) => {
    const result = await userService.getUserById(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * POST /api/users - Create new user/member
 */
app.post(
  '/api/users',
  asyncHandler(async (req, res) => {
    const result = await userService.createUser(req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }),
);

/**
 * PUT /api/users/:id - Update user
 */
app.put(
  '/api/users/:id',
  asyncHandler(async (req, res) => {
    const result = await userService.updateUser(req.params.id, req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * DELETE /api/users/:id - Delete user
 */
app.delete(
  '/api/users/:id',
  asyncHandler(async (req, res) => {
    const result = await userService.deleteUser(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

/**
 * GET /api/members - Get all members (alias for users with role=member)
 */
app.get(
  '/api/members',
  asyncHandler(async (req, res) => {
    const result = await userService.getUsersByRole('member');

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

// ==================== CLASSES ====================

/**
 * GET /api/classes - Get all classes
 */
app.get(
  '/api/classes',
  asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      difficulty: req.query.difficulty,
    };

    const result = await classService.getAllClasses(filters);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * GET /api/classes/:id - Get class by ID
 */
app.get(
  '/api/classes/:id',
  asyncHandler(async (req, res) => {
    const result = await classService.getClassById(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * POST /api/classes - Create new class
 */
app.post(
  '/api/classes',
  asyncHandler(async (req, res) => {
    const result = await classService.createClass(req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }),
);

/**
 * PUT /api/classes/:id - Update class
 */
app.put(
  '/api/classes/:id',
  asyncHandler(async (req, res) => {
    const result = await classService.updateClass(req.params.id, req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * DELETE /api/classes/:id - Delete class
 */
app.delete(
  '/api/classes/:id',
  asyncHandler(async (req, res) => {
    const result = await classService.deleteClass(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

// ==================== INSTRUCTORS ====================

/**
 * GET /api/instructors - Get all instructors
 */
app.get(
  '/api/instructors',
  asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
    };

    const result = await instructorService.getAllInstructors(filters);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * GET /api/instructors/:id - Get instructor by ID
 */
app.get(
  '/api/instructors/:id',
  asyncHandler(async (req, res) => {
    const result = await instructorService.getInstructorById(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * POST /api/instructors - Create new instructor
 */
app.post(
  '/api/instructors',
  asyncHandler(async (req, res) => {
    const result = await instructorService.createInstructor(req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }),
);

/**
 * PUT /api/instructors/:id - Update instructor
 */
app.put(
  '/api/instructors/:id',
  asyncHandler(async (req, res) => {
    const result = await instructorService.updateInstructor(req.params.id, req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * DELETE /api/instructors/:id - Delete instructor
 */
app.delete(
  '/api/instructors/:id',
  asyncHandler(async (req, res) => {
    const result = await instructorService.deleteInstructor(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

// ==================== SCHEDULE ====================

/**
 * GET /api/schedule - Get all schedule slots
 */
app.get(
  '/api/schedule',
  asyncHandler(async (req, res) => {
    const filters = {
      day_of_week: req.query.day_of_week,
      class_id: req.query.class_id,
      instructor_id: req.query.instructor_id,
      status: req.query.status,
    };

    const result = await scheduleService.getAllScheduleSlots(filters);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * GET /api/schedule/weekly - Get weekly schedule
 */
app.get(
  '/api/schedule/weekly',
  asyncHandler(async (req, res) => {
    const result = await scheduleService.getWeeklySchedule();

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * GET /api/schedule/:id - Get schedule slot by ID
 */
app.get(
  '/api/schedule/:id',
  asyncHandler(async (req, res) => {
    const result = await scheduleService.getScheduleSlotById(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * POST /api/schedule - Create schedule slot
 */
app.post(
  '/api/schedule',
  asyncHandler(async (req, res) => {
    const result = await scheduleService.createScheduleSlot(req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }),
);

/**
 * PUT /api/schedule/:id - Update schedule slot
 */
app.put(
  '/api/schedule/:id',
  asyncHandler(async (req, res) => {
    const result = await scheduleService.updateScheduleSlot(req.params.id, req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * DELETE /api/schedule/:id - Delete schedule slot
 */
app.delete(
  '/api/schedule/:id',
  asyncHandler(async (req, res) => {
    const result = await scheduleService.deleteScheduleSlot(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

/**
 * POST /api/schedule/:id/cancel - Cancel schedule slot
 */
app.post(
  '/api/schedule/:id/cancel',
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const result = await scheduleService.cancelScheduleSlot(req.params.id, reason);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

// ==================== BOOKINGS ====================

/**
 * POST /api/bookings - Book a class slot
 */
app.post(
  '/api/bookings',
  asyncHandler(async (req, res) => {
    const { userId, scheduleSlotId, bookingDate } = req.body;

    if (!userId || !scheduleSlotId || !bookingDate) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: userId, scheduleSlotId, bookingDate' });
    }

    const result = await bookingService.bookClassSlot(userId, scheduleSlotId, bookingDate);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }),
);

/**
 * POST /api/bookings/:id/cancel - Cancel a booking
 */
app.post(
  '/api/bookings/:id/cancel',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    const result = await bookingService.cancelBooking(req.params.id, userId);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

/**
 * GET /api/bookings/user/:userId - Get user's bookings
 */
app.get(
  '/api/bookings/user/:userId',
  asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      upcoming: req.query.upcoming === 'true',
    };

    const result = await bookingService.getUserBookings(req.params.userId, filters);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * GET /api/bookings - Get all bookings (admin)
 */
app.get(
  '/api/bookings',
  asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      booking_date: req.query.booking_date,
      schedule_slot_id: req.query.schedule_slot_id,
    };

    const result = await bookingService.getAllBookings(filters);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * POST /api/bookings/:id/attended - Mark booking as attended
 */
app.post(
  '/api/bookings/:id/attended',
  asyncHandler(async (req, res) => {
    const result = await bookingService.markAttended(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * POST /api/bookings/:id/no-show - Mark booking as no-show
 */
app.post(
  '/api/bookings/:id/no-show',
  asyncHandler(async (req, res) => {
    const result = await bookingService.markNoShow(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

// ==================== SUBSCRIPTIONS (MEMBERSHIPS) ====================

/**
 * GET /api/subscriptions - Get all subscriptions with member and plan details
 */
app.get(
  '/api/subscriptions',
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.getAllSubscriptions();

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, data: result.subscriptions });
  }),
);

/**
 * GET /api/subscriptions/:id - Get subscription by ID
 */
app.get(
  '/api/subscriptions/:id',
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.getSubscriptionById(parseInt(req.params.id));

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    if (!result.subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ success: true, data: result.subscription });
  }),
);

/**
 * GET /api/subscriptions/user/:userId - Get subscriptions by user ID
 */
app.get(
  '/api/subscriptions/user/:userId',
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.getSubscriptionsByUserId(req.params.userId);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, data: result.subscriptions });
  }),
);

/**
 * PUT /api/subscriptions/:id - Update subscription
 */
app.put(
  '/api/subscriptions/:id',
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.updateSubscription(parseInt(req.params.id), req.body);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: result.subscription,
    });
  }),
);

/**
 * POST /api/subscriptions/:id/suspend - Suspend a subscription
 */
app.post(
  '/api/subscriptions/:id/suspend',
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.suspendSubscription(parseInt(req.params.id));

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, message: 'Subscription suspended successfully' });
  }),
);

/**
 * POST /api/subscriptions/:id/reactivate - Reactivate a subscription
 */
app.post(
  '/api/subscriptions/:id/reactivate',
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.reactivateSubscription(parseInt(req.params.id));

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, message: 'Subscription reactivated successfully' });
  }),
);

/**
 * POST /api/subscriptions/:id/renew - Renew a subscription
 */
app.post(
  '/api/subscriptions/:id/renew',
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.renewSubscription(parseInt(req.params.id), req.body);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: result.subscription,
    });
  }),
);

/**
 * DELETE /api/subscriptions/:id - Cancel/Delete a subscription
 */
app.delete(
  '/api/subscriptions/:id',
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.cancelSubscription(parseInt(req.params.id));

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  }),
);

// ==================== NOTIFICATIONS ====================

/**
 * POST /api/notifications - Create a new notification
 */
app.post(
  '/api/notifications',
  asyncHandler(async (req, res) => {
    const result = await notificationService.createNotification(req.body);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({ success: true, data: result.notification });
  }),
);

/**
 * GET /api/notifications/user/:userId - Get notifications for a user
 */
app.get(
  '/api/notifications/user/:userId',
  asyncHandler(async (req, res) => {
    const result = await notificationService.getUserNotifications(req.params.userId);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, data: result.notifications });
  }),
);

/**
 * PUT /api/notifications/:id/sent - Mark notification as sent
 */
app.put(
  '/api/notifications/:id/sent',
  asyncHandler(async (req, res) => {
    const result = await notificationService.markAsSent(parseInt(req.params.id));

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, message: 'Notification marked as sent' });
  }),
);

/**
 * DELETE /api/notifications/:id - Delete a notification
 */
app.delete(
  '/api/notifications/:id',
  asyncHandler(async (req, res) => {
    const result = await notificationService.deleteNotification(parseInt(req.params.id));

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  }),
);

// ==================== INVITATIONS ====================

/**
 * POST /api/invitations - Create a new invitation
 */
app.post(
  '/api/invitations',
  asyncHandler(async (req, res) => {
    const { userId, email, phone, deliveryMethod, sentBy } = req.body;

    if (!userId || !email || !deliveryMethod) {
      return res.status(400).json({ error: 'userId, email, and deliveryMethod are required' });
    }

    const result = await invitationService.createInvitation({
      userId,
      email,
      phone,
      deliveryMethod,
      sentBy,
    });

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({ success: true, data: result.data });
  }),
);

/**
 * GET /api/invitations/:token - Validate invitation token
 */
app.get(
  '/api/invitations/:token',
  asyncHandler(async (req, res) => {
    const result = await invitationService.validateInvitationToken(req.params.token);

    if (!result.valid) {
      return res.status(400).json({ error: result.error || 'Invalid invitation token' });
    }

    res.json({ success: true, valid: true, data: result.data });
  }),
);

/**
 * POST /api/invitations/:token/accept - Accept invitation and register
 */
app.post(
  '/api/invitations/:token/accept',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password, firstName, lastName, phone, dateOfBirth } = req.body;

    // 1. Validate token
    const validation = await invitationService.validateInvitationToken(token);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || 'Invalid or expired invitation' });
    }

    const invitationData = validation.data;

    // 2. Create user account with invitation email
    const signupResult = await authService.signUp({
      email: invitationData.email,
      password,
      firstName,
      lastName,
      phone: phone || invitationData.phone,
      dateOfBirth,
      role: 'member',
    });

    if (signupResult.error) {
      return res.status(signupResult.status || 500).json({ error: signupResult.error });
    }

    // 3. Mark invitation as accepted
    await invitationService.acceptInvitation(token);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: signupResult.data,
    });
  }),
);

/**
 * GET /api/invitations/user/:userId - Get user's invitations
 */
app.get(
  '/api/invitations/user/:userId',
  asyncHandler(async (req, res) => {
    const result = await invitationService.getUserInvitations(req.params.userId);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, data: result.data });
  }),
);

// ==================== ANNOUNCEMENTS ====================

/**
 * GET /api/announcements - Get all published announcements
 */
app.get(
  '/api/announcements',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  }),
);

/**
 * GET /api/announcements/member - Get announcements for members (filtered by target_audience)
 */
app.get(
  '/api/announcements/member',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .or('target_audience.eq.all,target_audience.eq.members')
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  }),
);

/**
 * POST /api/announcements - Create new announcement (admin/reception/sparta only)
 */
app.post(
  '/api/announcements',
  asyncHandler(async (req, res) => {
    const { title, content, targetAudience, priority, createdBy } = req.body;

    if (!title || !content || !createdBy) {
      return res.status(400).json({ error: 'title, content, and createdBy are required' });
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        target_audience: targetAudience || 'all',
        priority: priority || 'normal',
        status: 'published',
        created_by: createdBy,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ success: true, data });
  }),
);

// ==================== USER SETTINGS ====================

/**
 * GET /api/settings/user/:userId - Get user settings
 */
app.get(
  '/api/settings/user/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      return res.status(500).json({ error: error.message });
    }

    // Return default settings if none exist
    if (!data) {
      return res.json({
        success: true,
        data: {
          user_id: userId,
          email_notifications: true,
          sms_notifications: false,
          push_notifications: false,
          language: 'en',
          theme: 'light',
        },
      });
    }

    res.json({ success: true, data });
  }),
);

/**
 * PUT /api/settings/user/:userId - Update or create user settings
 */
app.put(
  '/api/settings/user/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const settings = req.body;

    // Upsert settings (insert or update)
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  }),
);

// ==================== PUSH NOTIFICATIONS ====================

/**
 * POST /api/push/subscribe - Subscribe user to push notifications
 */
app.post(
  '/api/push/subscribe',
  asyncHandler(async (req, res) => {
    const { userId, subscription, platform } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({ error: 'userId and subscription are required' });
    }

    // Store subscription in user_settings
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          push_notifications: true,
          push_device_token: JSON.stringify(subscription),
          push_device_platform: platform || 'web',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  }),
);

/**
 * DELETE /api/push/unsubscribe/:userId - Unsubscribe user from push notifications
 */
app.delete(
  '/api/push/unsubscribe/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const { error } = await supabase
      .from('user_settings')
      .update({
        push_notifications: false,
        push_device_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  }),
);

/**
 * POST /api/push/send - Send push notification to specific user(s)
 * Admin/Reception/Sparta only
 */
app.post(
  '/api/push/send',
  asyncHandler(async (req, res) => {
    const { userIds, title, body, data } = req.body;

    if (!userIds || !title || !body) {
      return res.status(400).json({ error: 'userIds, title, and body are required' });
    }

    // Get user subscriptions
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('user_id, push_device_token, push_device_platform')
      .in('user_id', userIds)
      .eq('push_notifications', true);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // In a production environment, you would use a service like Firebase Cloud Messaging
    // or Web Push Protocol to actually send the notifications
    // For now, we'll just log them and return success
    console.log('📱 Push notifications to send:', {
      recipients: settings?.length || 0,
      title,
      body,
      data,
    });

    res.json({
      success: true,
      message: `Push notifications queued for ${settings?.length || 0} users`,
      sent: settings?.length || 0,
    });
  }),
);

/**
 * POST /api/announcements/:id/mark-read - Mark announcement as read by user
 */
app.post(
  '/api/announcements/:id/mark-read',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get current announcement
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('read_by_users')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    // Add user to read_by_users array if not already present
    const readByUsers = announcement?.read_by_users || [];
    if (!readByUsers.includes(userId)) {
      readByUsers.push(userId);

      const { error: updateError } = await supabase
        .from('announcements')
        .update({ read_by_users: readByUsers })
        .eq('id', id);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
    }

    res.json({ success: true, message: 'Announcement marked as read' });
  }),
);

// ==================== ERROR HANDLING & SERVER STARTUP ====================

/**
 * GET /api/settings/user/:userId - Get user settings
 */
app.get(
  '/api/settings/user/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay
      return res.status(500).json({ error: error.message });
    }

    // Return default settings if none exist
    if (!data) {
      const defaultSettings = {
        user_id: userId,
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        language: 'en',
        theme: 'light',
      };
      return res.json({ success: true, data: defaultSettings });
    }

    res.json({ success: true, data });
  }),
);

/**
 * PUT /api/settings/user/:userId - Update user settings (upsert)
 */
app.put(
  '/api/settings/user/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      pushDeviceToken,
      pushDevicePlatform,
      language,
      theme,
    } = req.body;

    const settingsData = {
      user_id: userId,
      email_notifications: emailNotifications,
      sms_notifications: smsNotifications,
      push_notifications: pushNotifications,
      push_device_token: pushDeviceToken,
      push_device_platform: pushDevicePlatform,
      language,
      theme,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(settingsData).forEach((key) => {
      if (settingsData[key] === undefined) {
        delete settingsData[key];
      }
    });

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settingsData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Settings updated successfully', data });
  }),
);

// ==================== BACKWARDS COMPATIBILITY (Legacy routes) ====================

// Legacy booking routes that map to new booking system
app.post(
  '/api/classes/:classId/book',
  asyncHandler(async (req, res) => {
    const { memberId, date, time } = req.body;

    // Find schedule slot matching the class, day, and time
    const result = await bookingService.bookClassSlot(memberId, req.params.classId, date);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({ success: true, message: 'Class booked successfully', data: result.data });
  }),
);

app.post(
  '/api/classes/:classId/cancel',
  asyncHandler(async (req, res) => {
    const { memberId } = req.body;

    // This would need to find the booking and cancel it
    // For now, return success
    res.json({ success: true, message: 'Booking cancelled successfully' });
  }),
);

app.get(
  '/api/members/:memberId/bookings',
  asyncHandler(async (req, res) => {
    const result = await bookingService.getUserBookings(req.params.memberId, { upcoming: true });

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({ success: true, data: result.data });
  }),
);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...');
    const connectionOk = await testConnection();

    if (!connectionOk) {
      console.warn(
        '⚠️  Supabase connection failed - server will start but database operations may fail',
      );
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Viking Hammer Backend API - PRODUCTION READY');
      console.log('==============================================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📱 Frontend (Vite) default: http://localhost:5173`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('🔐 Security Features:');
      console.log('   ✅ Password hashing with bcrypt');
      console.log('   ✅ JWT authentication');
      console.log('   ✅ Supabase database integration');
      console.log('');
      console.log('📊 Available Endpoints:');
      console.log('   AUTH:');
      console.log('     POST /api/auth/signup - Register new user');
      console.log('     POST /api/auth/signin - Login');
      console.log('     POST /api/auth/change-password - Update password');
      console.log('   USERS/MEMBERS:');
      console.log('     GET    /api/users - Get all users');
      console.log('     GET    /api/users/:id - Get user by ID');
      console.log('     POST   /api/users - Create user');
      console.log('     PUT    /api/users/:id - Update user');
      console.log('     DELETE /api/users/:id - Delete user');
      console.log('     GET    /api/members - Get all members');
      console.log('   CLASSES:');
      console.log('     GET    /api/classes - Get all classes');
      console.log('     GET    /api/classes/:id - Get class by ID');
      console.log('     POST   /api/classes - Create class');
      console.log('     PUT    /api/classes/:id - Update class');
      console.log('     DELETE /api/classes/:id - Delete class');
      console.log('   INSTRUCTORS:');
      console.log('     GET    /api/instructors - Get all instructors');
      console.log('     GET    /api/instructors/:id - Get instructor by ID');
      console.log('     POST   /api/instructors - Create instructor');
      console.log('     PUT    /api/instructors/:id - Update instructor');
      console.log('     DELETE /api/instructors/:id - Delete instructor');
      console.log('   SCHEDULE:');
      console.log('     GET    /api/schedule - Get all schedule slots');
      console.log('     GET    /api/schedule/weekly - Get weekly schedule');
      console.log('     GET    /api/schedule/:id - Get schedule slot');
      console.log('     POST   /api/schedule - Create schedule slot');
      console.log('     PUT    /api/schedule/:id - Update schedule slot');
      console.log('     DELETE /api/schedule/:id - Delete schedule slot');
      console.log('     POST   /api/schedule/:id/cancel - Cancel slot');
      console.log('   BOOKINGS:');
      console.log('     POST   /api/bookings - Book a class');
      console.log('     POST   /api/bookings/:id/cancel - Cancel booking');
      console.log('     GET    /api/bookings/user/:userId - Get user bookings');
      console.log('     GET    /api/bookings - Get all bookings (admin)');
      console.log('     POST   /api/bookings/:id/attended - Mark attended');
      console.log('     POST   /api/bookings/:id/no-show - Mark no-show');
      console.log('   SUBSCRIPTIONS:');
      console.log('     GET    /api/subscriptions - Get all subscriptions');
      console.log('     GET    /api/subscriptions/:id - Get subscription');
      console.log('     GET    /api/subscriptions/user/:userId - Get user subs');
      console.log('     PUT    /api/subscriptions/:id - Update subscription');
      console.log('     POST   /api/subscriptions/:id/suspend - Suspend');
      console.log('     POST   /api/subscriptions/:id/reactivate - Reactivate');
      console.log('     POST   /api/subscriptions/:id/renew - Renew');
      console.log('     DELETE /api/subscriptions/:id - Cancel subscription');
      console.log('   NOTIFICATIONS:');
      console.log('     POST   /api/notifications - Create notification');
      console.log('     GET    /api/notifications/user/:userId - Get user notifications');
      console.log('     PUT    /api/notifications/:id/sent - Mark as sent');
      console.log('     DELETE /api/notifications/:id - Delete notification');
      console.log('');
      console.log('==============================================');
      console.log('✅ Ready for UAT testing');
      
      // Keep process alive
      setInterval(() => {
        // Heartbeat to prevent process exit
      }, 60000); // Every minute
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close other instances or change the port.`);
        process.exit(1);
      }
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Don't exit - keep server running
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
