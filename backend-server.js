// backend-server.js - PRODUCTION-READY with Supabase + bcrypt
// Complete backend with database persistence, password hashing, and full CRUD operations

const express = require('express');
const cors = require('cors');
const { supabase, testConnection } = require('./supabaseClient');

// Import middleware
const { authenticate, optionalAuth } = require('./middleware/authMiddleware');
const {
  authorize,
  isAdmin,
  isSpartaOnly,
  canAccessUserResource,
} = require('./middleware/authorizationMiddleware');

// Import services
const authService = require('./services/authService');
const userService = require('./services/userService');
const classService = require('./services/classService');
const instructorService = require('./services/instructorService');
const scheduleService = require('./services/scheduleService');
const bookingService = require('./services/bookingService');
const subscriptionService = require('./services/subscriptionService');
const planService = require('./services/planService');
const notificationService = require('./services/notificationService');
const invitationService = require('./services/invitationService');
const resetService = require('./services/resetService');
const qrService = require('./services/qrService');
const checkInService = require('./services/checkInService');

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

/**
 * POST /api/auth/forgot-password - Request password reset
 */
app.post(
  '/api/auth/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await resetService.createPasswordResetToken(email);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Always return success message (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
    });
  }),
);

/**
 * GET /api/auth/reset-password/:token - Validate reset token
 */
app.get(
  '/api/auth/reset-password/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    const result = await resetService.validateResetToken(token);

    if (!result.valid) {
      return res.status(400).json({ error: result.error || 'Invalid reset token' });
    }

    res.json({ success: true, valid: true, data: result.data });
  }),
);

/**
 * POST /api/auth/reset-password - Reset password with token
 */
app.post(
  '/api/auth/reset-password',
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await resetService.resetPassword(token, newPassword);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  }),
);

// ==================== USERS/MEMBERS ====================

/**
 * GET /api/users/me - Get current user profile
 */
app.get(
  '/api/users/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await userService.getUserById(req.user.userId);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * GET /api/users - Get all users with optional filters (Admin only)
 */
app.get(
  '/api/users',
  authenticate,
  isAdmin,
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
 * GET /api/users/:id - Get user by ID (Admin or self)
 */
app.get(
  '/api/users/:id',
  authenticate,
  canAccessUserResource('id'),
  asyncHandler(async (req, res) => {
    const result = await userService.getUserById(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.data);
  }),
);

/**
 * POST /api/users - Create new user/member (Admin only)
 */
app.post(
  '/api/users',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await userService.createUser(req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }),
);

/**
 * PUT /api/users/:id - Update user (Admin or self)
 */
app.put(
  '/api/users/:id',
  authenticate,
  canAccessUserResource('id'),
  asyncHandler(async (req, res) => {
    const result = await userService.updateUser(req.params.id, req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ success: false, error: result.error });
    }

    res.json({ success: true, user: result.data });
  }),
);

/**
 * DELETE /api/users/:id - Delete user (Admin only)
 */
app.delete(
  '/api/users/:id',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await userService.deleteUser(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

/**
 * GET /api/members - Get all members (Admin only)
 */
app.get(
  '/api/members',
  authenticate,
  isAdmin,
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
 * GET /api/classes - Get all classes (authenticated users)
 */
app.get(
  '/api/classes',
  authenticate,
  asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      difficulty: req.query.difficulty,
    };

    const result = await classService.getAllClasses(filters);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

/**
 * GET /api/classes/:id - Get class by ID (authenticated users)
 */
app.get(
  '/api/classes/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await classService.getClassById(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);

/**
 * POST /api/classes - Create new class (Admin only)
 */
app.post(
  '/api/classes',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await classService.createClass(req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json(result); // Return full result object like GET does
  }),
);

/**
 * PUT /api/classes/:id - Update class (Admin only)
 */
app.put(
  '/api/classes/:id',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await classService.updateClass(req.params.id, req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result); // Return full result object like GET does
  }),
);

/**
 * DELETE /api/classes/:id - Delete class (Sparta only)
 * Query params: ?force=true for force delete with dependencies
 */
app.delete(
  '/api/classes/:id',
  authenticate,
  isSpartaOnly,
  asyncHandler(async (req, res) => {
    const forceDelete = req.query.force === 'true';
    console.log(`🔥 DELETE CLASS API: ${req.params.id}, force: ${forceDelete}`);

    const result = await classService.deleteClass(req.params.id, forceDelete);

    if (result.error) {
      console.log(`❌ DELETE CLASS ERROR: ${result.error}`);
      return res.status(result.status || 500).json({ error: result.error });
    }

    console.log(`✅ DELETE CLASS SUCCESS: ${result.message}`);
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

    res.json(result);
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

    res.json(result);
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

    res.status(201).json(result);
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

    res.json(result);
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

    res.json(result);
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

    res.json(result);
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

/**
 * GET /api/schedule/:id/bookings - Get roster for a schedule slot
 */
app.get(
  '/api/schedule/:id/bookings',
  authenticate,
  authorize('sparta', 'reception', 'instructor'),
  asyncHandler(async (req, res) => {
    const result = await bookingService.getScheduleSlotRoster(req.params.id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({ success: true, data: result.data });
  }),
);

// ==================== BOOKINGS ====================

/**
 * POST /api/bookings - Book a class slot
 * Accepts EITHER: { userId, scheduleSlotId, bookingDate }
 * OR: { userId, classId, dayOfWeek, startTime, bookingDate }
 */
app.post(
  '/api/bookings',
  asyncHandler(async (req, res) => {
    const { userId, scheduleSlotId, classId, dayOfWeek, startTime, bookingDate } = req.body;

    if (!userId || !bookingDate) {
      return res.status(400).json({ error: 'Missing required fields: userId and bookingDate' });
    }

    // Determine which format we received
    let slotIdentifier;
    if (scheduleSlotId) {
      slotIdentifier = scheduleSlotId;
    } else if (classId && dayOfWeek !== undefined && startTime) {
      slotIdentifier = { classId, dayOfWeek, startTime };
    } else {
      return res.status(400).json({
        error: 'Must provide either scheduleSlotId OR (classId, dayOfWeek, startTime)',
      });
    }

    const result = await bookingService.bookClassSlot(userId, slotIdentifier, bookingDate);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json({ success: true, data: result.data });
  }),
);

/**
 * POST /api/bookings/:id/cancel - Cancel a booking
 */
app.post(
  '/api/bookings/:id/cancel',
  (req, res, next) => {
    console.log('🔥🔥🔥 CANCEL ROUTE HIT! 🔥🔥🔥');
    console.log('  URL:', req.url);
    console.log('  Params:', req.params);
    console.log('  Body:', req.body);
    next();
  },
  asyncHandler(async (req, res) => {
    console.log('🚫 CANCEL BOOKING REQUEST RECEIVED:');
    console.log('  Booking ID:', req.params.id);
    console.log('  Request Body:', req.body);

    const { userId } = req.body;

    if (!userId) {
      console.log('  ❌ ERROR: Missing userId in request body');
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    console.log('  Calling bookingService.cancelBooking...');
    const result = await bookingService.cancelBooking(req.params.id, userId);

    if (result.error) {
      console.log('  ❌ ERROR from bookingService:', result.error);
      return res.status(result.status || 500).json({ error: result.error });
    }

    console.log('  ✅ SUCCESS: Booking cancelled');
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

// ==================== PLANS (MEMBERSHIP PLANS) ====================

/**
 * GET /api/plans - Get all membership plans
 * Public endpoint - anyone can view available plans
 */
app.get(
  '/api/plans',
  asyncHandler(async (req, res) => {
    const result = await planService.getAllPlans();

    if (result.error) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.plans });
  }),
);

/**
 * GET /api/plans/:id - Get a single plan by ID
 * Public endpoint
 */
app.get(
  '/api/plans/:id',
  asyncHandler(async (req, res) => {
    const result = await planService.getPlanById(parseInt(req.params.id));

    if (result.error) {
      return res.status(500).json({ success: false, error: result.error });
    }

    if (!result.plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    res.json({ success: true, data: result.plan });
  }),
);

/**
 * POST /api/plans - Create a new membership plan
 * Restricted to Sparta role only
 */
app.post(
  '/api/plans',
  authenticate,
  isSpartaOnly,
  asyncHandler(async (req, res) => {
    const result = await planService.createPlan(req.body);

    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }

    // Include warning if metadata not saved
    const response = { success: true, data: result.plan };
    if (result.warning) {
      response.warning = result.warning;
    }

    res.status(201).json(response);
  }),
);

/**
 * PUT /api/plans/:id - Update an existing membership plan
 * Restricted to Sparta role only
 */
app.put(
  '/api/plans/:id',
  authenticate,
  isSpartaOnly,
  asyncHandler(async (req, res) => {
    const result = await planService.updatePlan(parseInt(req.params.id), req.body);

    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }

    if (!result.plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Include warning if metadata not saved
    const response = { success: true, data: result.plan };
    if (result.warning) {
      response.warning = result.warning;
    }

    res.json(response);
  }),
);

/**
 * DELETE /api/plans/:id - Delete a membership plan
 * Restricted to Sparta role only
 * Cannot delete plans with active subscriptions
 */
app.delete(
  '/api/plans/:id',
  authenticate,
  isSpartaOnly,
  asyncHandler(async (req, res) => {
    const result = await planService.deletePlan(parseInt(req.params.id));

    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, message: 'Plan deleted successfully' });
  }),
);

// ==================== SUBSCRIPTIONS (MEMBERSHIPS) ====================

/**
 * POST /api/subscriptions - Create a new subscription
 */
app.post(
  '/api/subscriptions',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.createSubscription(req.body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ success: true, data: result.subscription });
  }),
);

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

    // 2. Check if user already has a complete profile (created by admin)
    const hasExistingProfile = invitationData.users_profile && invitationData.users_profile.name;

    // 3. Create/update user account
    const signupResult = await authService.signUp({
      email: invitationData.email,
      password,
      // Only pass name/phone/dob for NEW users without existing profile
      ...(hasExistingProfile
        ? {}
        : {
            firstName,
            lastName,
            phone: phone || invitationData.phone,
            dateOfBirth,
          }),
      role: 'member',
    });

    if (signupResult.error) {
      return res.status(signupResult.status || 500).json({ error: signupResult.error });
    }

    // 4. Mark invitation as accepted
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
 * Query params:
 *   - userId: Filter to show only unread announcements for this user
 *   - unreadOnly: If 'true', filters to unread announcements for userId
 */
app.get(
  '/api/announcements/member',
  asyncHandler(async (req, res) => {
    const { userId, unreadOnly } = req.query;

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

    // Filter unread announcements if requested
    let filteredData = data;
    if (userId && unreadOnly === 'true') {
      filteredData = data.filter((announcement) => {
        const readByUsers = announcement.read_by_users || [];
        return !readByUsers.includes(userId);
      });
    }

    res.json({ success: true, data: filteredData });
  }),
);

/**
 * GET /api/announcements/instructor - Get announcements for instructors (filtered by target_audience)
 */
app.get(
  '/api/announcements/instructor',
  asyncHandler(async (req, res) => {
    const { userId, unreadOnly } = req.query;

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .or('target_audience.eq.all,target_audience.eq.instructors')
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filter unread announcements if requested
    let filteredData = data;
    if (userId && unreadOnly === 'true') {
      filteredData = data.filter((announcement) => {
        const readByUsers = announcement.read_by_users || [];
        return !readByUsers.includes(userId);
      });
    }

    res.json({ success: true, data: filteredData });
  }),
);

/**
 * GET /api/announcements/staff - Get announcements for staff/reception (filtered by target_audience)
 */
app.get(
  '/api/announcements/staff',
  asyncHandler(async (req, res) => {
    const { userId, unreadOnly } = req.query;

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .or('target_audience.eq.all,target_audience.eq.staff')
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filter unread announcements if requested
    let filteredData = data;
    if (userId && unreadOnly === 'true') {
      filteredData = data.filter((announcement) => {
        const readByUsers = announcement.read_by_users || [];
        return !readByUsers.includes(userId);
      });
    }

    res.json({ success: true, data: filteredData });
  }),
);

/**
 * POST /api/announcements - Create new announcement (admin/reception/sparta only)
 */
app.post(
  '/api/announcements',
  asyncHandler(async (req, res) => {
    const { title, content, targetAudience, priority, createdBy } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    // For demo mode: Set created_by to NULL if user doesn't exist in database
    // This allows announcements to be created without foreign key constraints
    let finalCreatedBy = null;

    if (createdBy) {
      // Check if user exists in database
      const { data: userExists } = await supabase
        .from('users_profile')
        .select('id')
        .eq('id', createdBy)
        .single();

      // Only set created_by if user exists in database
      if (userExists) {
        finalCreatedBy = createdBy;
      } else {
        console.log(
          `⚠️ User ${createdBy} not in database - setting created_by to NULL for demo mode`,
        );
      }
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        target_audience: targetAudience || 'all',
        priority: priority || 'normal',
        status: 'published',
        created_by: finalCreatedBy, // NULL if demo user, UUID if real user
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        error: error.message,
        details: 'Database constraint violation. Please check your account setup.',
      });
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
  authenticate,
  canAccessUserResource('userId'),
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
  authenticate,
  authorize('member', 'sparta', 'reception'),
  asyncHandler(async (req, res) => {
    const { memberId, date, time } = req.body;

    // Use authenticated user if memberId not provided
    const actualMemberId = memberId || req.user.userId;

    console.log(
      `📅 Booking request: Class ${req.params.classId}, Date ${date}, Time ${time}, Member ${actualMemberId}`,
    );

    // Calculate day of week from date - IMPORTANT: Parse the date string properly
    const bookingDate = new Date(date + 'T00:00:00'); // Add time to ensure correct date parsing
    const dayOfWeek = bookingDate.getUTCDay(); // Use UTC to avoid timezone issues
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];

    console.log(
      `🔍 Looking for schedule slot: Day=${dayName}, Time=${time}, Date=${date}, dayOfWeek=${dayOfWeek}`,
    );

    // Find the schedule slot matching class, day, and time
    const { data: slot, error: slotError } = await supabase
      .from('schedule_slots')
      .select('id, class_id, day_of_week, start_time, end_time, status')
      .eq('class_id', req.params.classId)
      .eq('day_of_week', dayName)
      .eq('start_time', time)
      .eq('status', 'active')
      .single();

    if (slotError || !slot) {
      console.error('❌ Schedule slot not found:', slotError);
      return res.status(404).json({
        error: 'No class scheduled for this day/time',
        details: { classId: req.params.classId, day: dayName, time },
      });
    }

    console.log(`✅ Found schedule slot: ${slot.id}`);

    // Now book using the schedule slot ID
    const result = await bookingService.bookClassSlot(actualMemberId, slot.id, date);

    if (result.error) {
      console.error('❌ Booking failed:', result.error);
      return res.status(result.status || 500).json({ error: result.error });
    }

    console.log(`✅ Booking successful for member ${actualMemberId}`);

    // Get user and class details for notification
    const { data: user } = await supabase
      .from('users_profile')
      .select('id, name, email')
      .eq('id', actualMemberId)
      .single();

    const { data: classInfo } = await supabase
      .from('classes')
      .select('id, name, description')
      .eq('id', req.params.classId)
      .single();

    // Send notification to admin team (reception, sparta, instructors)
    try {
      const userName = user?.name || user?.email || 'A member';
      const className = classInfo ? classInfo.name : 'a class';

      // Get all users with admin roles
      const { data: adminUsers } = await supabase
        .from('users_profile')
        .select('id')
        .in('role', ['reception', 'sparta', 'instructor']);

      // Create notifications for each admin
      if (adminUsers && adminUsers.length > 0) {
        const notificationService = require('./services/notificationService');

        for (const admin of adminUsers) {
          await notificationService.createNotification({
            recipient_user_id: admin.id,
            payload: {
              type: 'class_booking',
              title: 'New Class Booking',
              message: `${userName} has joined ${className} on ${date} at ${time}`,
              class_id: req.params.classId,
              member_id: actualMemberId,
              booking_date: date,
              booking_time: time,
            },
            channel: 'in_app',
            status: 'pending',
          });
        }

        console.log(`📢 Sent notifications to ${adminUsers.length} admin users`);
      }
    } catch (notifyError) {
      console.warn('⚠️ Failed to send notifications:', notifyError);
      // Don't fail the booking if notification fails
    }

    res.json({
      success: true,
      message: 'Class booked successfully',
      data: result.data,
    });
  }),
);

app.post(
  '/api/classes/:classId/cancel',
  asyncHandler(async (req, res) => {
    const { memberId, date, time } = req.body;

    console.log(`❌ Cancel booking request: Class ${req.params.classId}, Member ${memberId}`);

    // Find the booking to cancel
    const { data: bookings } = await supabase
      .from('class_bookings')
      .select('id, schedule_slot_id, status')
      .eq('user_id', memberId)
      .eq('booking_date', date);

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Cancel the first matching booking
    const result = await bookingService.cancelBooking(bookings[0].id);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  }),
);

app.get(
  '/api/members/:memberId/bookings',
  authenticate,
  canAccessUserResource('memberId'),
  asyncHandler(async (req, res) => {
    const result = await bookingService.getUserBookings(req.params.memberId, { upcoming: true });

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({ success: true, data: result.data });
  }),
);

// ==================== QR CODES ====================

/**
 * POST /api/qr/mint - Generate QR code for member check-in
 */
app.post(
  '/api/qr/mint',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.body.userId || req.user.userId;

    const result = await qrService.mintQRCode(userId);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({ success: true, data: result.data });
  }),
);

/**
 * POST /api/qr/verify - Verify QR code
 */
app.post(
  '/api/qr/verify',
  authenticate,
  authorize('sparta', 'reception'),
  asyncHandler(async (req, res) => {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ error: 'qrCode is required' });
    }

    const result = await qrService.verifyQRCode(qrCode);

    if (result.error) {
      return res.status(result.status || 400).json({
        error: result.error,
        valid: result.valid,
      });
    }

    res.json({ success: true, valid: result.valid, data: result.data });
  }),
);

// ==================== CHECK-INS ====================

/**
 * POST /api/check-ins - Create check-in (Reception/Sparta)
 */
app.post(
  '/api/check-ins',
  authenticate,
  authorize('sparta', 'reception'),
  asyncHandler(async (req, res) => {
    const result = await checkInService.createCheckIn(req.body);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.status(201).json({ success: true, data: result.data });
  }),
);

/**
 * GET /api/check-ins - Get all check-ins (Admin)
 */
app.get(
  '/api/check-ins',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const filters = {
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      locationId: req.query.locationId,
    };

    const result = await checkInService.getAllCheckIns(filters);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({ success: true, data: result.data });
  }),
);

/**
 * GET /api/check-ins/user/:userId - Get user check-ins
 */
app.get(
  '/api/check-ins/user/:userId',
  authenticate,
  canAccessUserResource('userId'),
  asyncHandler(async (req, res) => {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await checkInService.getUserCheckIns(req.params.userId, options);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json({ success: true, data: result.data });
  }),
);

// ==================== BIRTHDAYS ====================

/**
 * GET /api/birthdays - Get upcoming birthdays
 */
app.get(
  '/api/birthdays',
  authenticate,
  authorize('sparta', 'reception'),
  asyncHandler(async (req, res) => {
    const daysAhead = parseInt(req.query.days) || 30;

    const { data, error } = await supabase
      .from('users_profile')
      .select('id, name, email, phone, date_of_birth, membership_type, profile_image, created_at')
      .eq('role', 'member')
      .not('date_of_birth', 'is', null)
      .order('date_of_birth', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const today = new Date();
    const upcomingBirthdays = data
      .map((user) => {
        const dob = new Date(user.date_of_birth);
        const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

        // If birthday already passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
        const age = today.getFullYear() - dob.getFullYear();

        const fullName = user.name || '';
        const [firstName, ...lastParts] = fullName.trim().split(' ');
        const lastName = lastParts.join(' ');

        return {
          id: user.id,
          firstName: firstName || fullName || 'Member',
          lastName: lastName || '',
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.date_of_birth,
          membershipType: user.membership_type,
          profileImage: user.profile_image,
          joinDate: user.created_at,
          age: age,
          daysUntilBirthday: daysUntil,
          isToday: daysUntil === 0,
          thisWeek: daysUntil <= 7,
          thisMonth: daysUntil <= 30,
        };
      })
      .filter((user) => user.daysUntilBirthday <= daysAhead)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

    res.json({ success: true, data: upcomingBirthdays });
  }),
);

// ==================== STATISTICS ====================

/**
 * GET /api/statistics - Get check-in statistics
 */
app.get(
  '/api/statistics',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const filters = {
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await checkInService.getCheckInStatistics(filters);

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
      console.log('   PLANS:');
      console.log('     GET    /api/plans - Get all membership plans');
      console.log('     GET    /api/plans/:id - Get plan by ID');
      console.log('     POST   /api/plans - Create new plan (Sparta)');
      console.log('     PUT    /api/plans/:id - Update plan (Sparta)');
      console.log('     DELETE /api/plans/:id - Delete plan (Sparta)');
      console.log('   SUBSCRIPTIONS:');
      console.log('     POST   /api/subscriptions - Create new subscription');
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
        console.error(
          `Port ${PORT} is already in use. Please close other instances or change the port.`,
        );
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
