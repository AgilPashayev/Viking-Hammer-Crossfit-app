const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockUsers = [
  {
    id: 'user1',
    email: 'john.viking@example.com',
    firstName: 'John',
    lastName: 'Viking',
    phone: '+994501234567',
    countryCode: '+994',
    dateOfBirth: '1990-05-15',
    membershipType: 'Viking Warrior Pro',
    joinDate: '2023-01-15',
    isActive: true,
  },
  {
    id: 'user2',
    email: 'sarah.warrior@example.com',
    firstName: 'Sarah',
    lastName: 'Warrior',
    phone: '+994501234568',
    countryCode: '+994',
    dateOfBirth: '1995-08-22',
    membershipType: 'Monthly Unlimited',
    joinDate: '2023-03-20',
    isActive: true,
  },
];

const mockCheckIns = [
  {
    id: 'checkin1',
    userId: 'user1',
    userName: 'John Viking',
    timestamp: new Date().toISOString(),
    location: 'Main Entrance',
    membershipStatus: 'Viking Warrior Pro',
  },
];

// Mock membership history data
const mockMembershipHistory = {
  user1: [
    {
      id: 'mem1',
      user_id: 'user1',
      plan_name: 'Viking Warrior Pro',
      plan_type: 'premium',
      start_date: '2025-01-15',
      end_date: null,
      duration_months: null,
      status: 'active',
      amount: 79.99,
      currency: 'USD',
      payment_method: 'credit_card',
      payment_status: 'paid',
      renewal_type: 'monthly',
      auto_renew: true,
      next_billing_date: '2025-11-15',
      class_limit: null,
      created_at: '2025-01-15T00:00:00Z',
      cancelled_at: null,
      cancellation_reason: null,
    },
    {
      id: 'mem2',
      user_id: 'user1',
      plan_name: 'Viking Starter',
      plan_type: 'basic',
      start_date: '2024-06-01',
      end_date: '2025-01-14',
      duration_months: 6,
      status: 'expired',
      amount: 39.99,
      currency: 'USD',
      payment_method: 'credit_card',
      payment_status: 'paid',
      renewal_type: 'monthly',
      auto_renew: false,
      next_billing_date: null,
      class_limit: 12,
      created_at: '2024-06-01T00:00:00Z',
      cancelled_at: null,
      cancellation_reason: null,
    },
    {
      id: 'mem3',
      user_id: 'user1',
      plan_name: 'Trial Membership',
      plan_type: 'trial',
      start_date: '2024-05-15',
      end_date: '2024-05-31',
      duration_months: 1,
      status: 'completed',
      amount: 0,
      currency: 'USD',
      payment_method: 'free',
      payment_status: 'paid',
      renewal_type: 'one_time',
      auto_renew: false,
      next_billing_date: null,
      class_limit: 5,
      created_at: '2024-05-15T00:00:00Z',
      cancelled_at: null,
      cancellation_reason: null,
    },
  ],
  user2: [
    {
      id: 'mem4',
      user_id: 'user2',
      plan_name: 'Monthly Unlimited',
      plan_type: 'premium',
      start_date: '2023-03-20',
      end_date: null,
      duration_months: null,
      status: 'active',
      amount: 69.99,
      currency: 'USD',
      payment_method: 'debit_card',
      payment_status: 'paid',
      renewal_type: 'monthly',
      auto_renew: true,
      next_billing_date: '2025-11-20',
      class_limit: null,
      created_at: '2023-03-20T00:00:00Z',
      cancelled_at: null,
      cancellation_reason: null,
    },
  ],
};

// API Routes

// QR Code validation endpoint
app.post('/api/qr/validate', (req, res) => {
  const { qrData } = req.body;

  // Mock validation logic
  const isValid = qrData && (typeof qrData === 'object' || typeof qrData === 'string');

  if (isValid) {
    const user = mockUsers[0]; // Return first mock user
    res.json({
      isValid: true,
      user: user,
      message: 'QR code validated successfully',
    });
  } else {
    res.json({
      isValid: false,
      error: 'Invalid QR code format',
    });
  }
});

// User authentication endpoints
app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;

  const user = mockUsers.find((u) => u.email === email);
  if (user && password) {
    res.json({
      user: user,
      session: { access_token: 'mock_token_' + Date.now() },
    });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/signup', (req, res) => {
  const userData = req.body;
  const newUser = {
    id: `user${Date.now()}`,
    ...userData,
    joinDate: new Date().toISOString(),
    isActive: true,
  };

  mockUsers.push(newUser);
  res.json({
    user: newUser,
    session: { access_token: 'mock_token_' + Date.now() },
  });
});

// User profile endpoints
app.get('/api/users/:id', (req, res) => {
  const user = mockUsers.find((u) => u.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const userIndex = mockUsers.findIndex((u) => u.id === req.params.id);
  if (userIndex !== -1) {
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...req.body };
    res.json(mockUsers[userIndex]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Check-in endpoints
app.post('/api/checkins', (req, res) => {
  const checkIn = {
    id: `checkin${Date.now()}`,
    ...req.body,
    timestamp: new Date().toISOString(),
  };

  mockCheckIns.push(checkIn);
  res.json(checkIn);
});

app.get('/api/checkins', (req, res) => {
  res.json(mockCheckIns);
});

// Email verification endpoints
app.post('/api/email/verify', (req, res) => {
  const { token } = req.body;

  // Mock verification - in production, this would check the database
  if (token && token.length > 0) {
    res.json({
      success: true,
      message: 'Email verified successfully',
      userId: 'mock_user_id',
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid verification token',
    });
  }
});

app.post('/api/email/resend', (req, res) => {
  const { userId, email } = req.body;

  // Mock resend - in production, this would generate a new token and send email
  if (userId && email) {
    res.json({
      success: true,
      message: 'Verification email resent successfully',
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'User ID and email are required',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Viking Hammer API is running',
    timestamp: new Date().toISOString(),
  });
});

// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  // Redirect to a placeholder image service
  res.redirect(`https://via.placeholder.com/${width}x${height}/0b5eff/ffffff?text=VH`);
});

// Get membership history for a user
app.get('/api/users/:userId/membership-history', (req, res) => {
  const { userId } = req.params;

  console.log(`📋 Fetching membership history for user: ${userId}`);

  const history = mockMembershipHistory[userId] || [];

  res.json({
    success: true,
    data: history,
    count: history.length,
  });
});

// Get active membership for a user
app.get('/api/users/:userId/active-membership', (req, res) => {
  const { userId } = req.params;

  console.log(`✅ Fetching active membership for user: ${userId}`);

  const history = mockMembershipHistory[userId] || [];
  const activeMembership = history.find((m) => m.status === 'active');

  res.json({
    success: true,
    data: activeMembership || null,
  });
});

// Create new membership record
app.post('/api/membership-history', (req, res) => {
  const membershipData = req.body;

  console.log(`➕ Creating new membership record:`, membershipData);

  const newMembership = {
    id: `mem_${Date.now()}`,
    ...membershipData,
    created_at: new Date().toISOString(),
  };

  if (!mockMembershipHistory[membershipData.user_id]) {
    mockMembershipHistory[membershipData.user_id] = [];
  }

  mockMembershipHistory[membershipData.user_id].unshift(newMembership);

  res.json({
    success: true,
    id: newMembership.id,
    data: newMembership,
  });
});

// Update membership status
app.put('/api/membership-history/:membershipId/status', (req, res) => {
  const { membershipId } = req.params;
  const { status, cancelled_by, cancellation_reason } = req.body;

  console.log(`🔄 Updating membership status: ${membershipId} to ${status}`);

  let found = false;

  for (const userId in mockMembershipHistory) {
    const membership = mockMembershipHistory[userId].find((m) => m.id === membershipId);
    if (membership) {
      membership.status = status;
      if (status === 'cancelled') {
        membership.cancelled_at = new Date().toISOString();
        membership.cancelled_by = cancelled_by;
        membership.cancellation_reason = cancellation_reason;
      }
      found = true;
      break;
    }
  }

  res.json({
    success: found,
    message: found ? 'Membership status updated' : 'Membership not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Viking Hammer Backend API running on http://localhost:${PORT}`);
  console.log(`📱 Frontend (Vite) default: http://localhost:5173`);
  console.log(`🔍 API Health Check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Available API Endpoints:');
  console.log('  POST /api/qr/validate - Validate QR codes');
  console.log('  POST /api/auth/signin - User sign in');
  console.log('  POST /api/auth/signup - User sign up');
  console.log('  GET  /api/users/:id - Get user profile');
  console.log('  PUT  /api/users/:id - Update user profile');
  console.log('  POST /api/checkins - Record check-in');
  console.log('  GET  /api/checkins - Get check-ins');
  console.log('  POST /api/email/verify - Verify email with token');
  console.log('  POST /api/email/resend - Resend verification email');
  console.log('  GET  /api/users/:userId/membership-history - Get membership history');
  console.log('  GET  /api/users/:userId/active-membership - Get active membership');
  console.log('  POST /api/membership-history - Create membership record');
  console.log('  PUT  /api/membership-history/:id/status - Update membership status');
  console.log('  GET  /api/health - Health check');
});

module.exports = app;
