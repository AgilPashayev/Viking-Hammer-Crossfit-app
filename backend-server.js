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
  console.log('  GET  /api/health - Health check');
});

module.exports = app;
