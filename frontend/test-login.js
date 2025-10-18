// LOGIN FUNCTIONALITY DEEP TEST SCRIPT
// Open browser console (F12) and paste this script to run comprehensive tests

console.clear();
console.log('🔍 STARTING DEEP LOGIN FUNCTIONALITY TEST\n');
console.log('='.repeat(80));

// TEST 1: Check if demo mode is detected correctly
console.log('\n📍 TEST 1: Demo Mode Detection');
console.log('-'.repeat(80));
const hostname = window.location.hostname;
const isDemoMode =
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
console.log('Current hostname:', hostname);
console.log('Demo mode detected:', isDemoMode ? '✅ YES' : '❌ NO');

// TEST 2: Check localStorage for demo users
console.log('\n📍 TEST 2: LocalStorage Demo Users');
console.log('-'.repeat(80));
const storedUsers = localStorage.getItem('viking_demo_users');
if (!storedUsers) {
  console.error('❌ CRITICAL: No demo users found in localStorage!');
  console.log('This is the root cause - no users exist to login with.');
} else {
  try {
    const users = JSON.parse(storedUsers);
    const userEmails = Object.keys(users);
    console.log('✅ Demo users found:', userEmails.length);
    console.log('📧 Available email addresses:');
    userEmails.forEach((email) => {
      const user = users[email];
      console.log(`  - ${email}`);
      console.log(`    Name: ${user.profile.firstName} ${user.profile.lastName}`);
      console.log(`    Password length: ${user.password.length} characters`);
      console.log(`    Has profile: ${user.profile ? '✅' : '❌'}`);
    });
  } catch (error) {
    console.error('❌ ERROR: Failed to parse demo users:', error);
  }
}

// TEST 3: Check if debug utilities are available
console.log('\n📍 TEST 3: Debug Utilities Availability');
console.log('-'.repeat(80));
if (typeof window.debugAuth !== 'undefined') {
  console.log('✅ Debug utilities loaded');
  console.log('Available functions:');
  Object.keys(window.debugAuth).forEach((key) => {
    console.log(`  - debugAuth.${key}()`);
  });
} else {
  console.error('❌ Debug utilities NOT loaded');
  console.log('Expected: debugAuth object should be available globally');
}

// TEST 4: Simulate a login attempt
console.log('\n📍 TEST 4: Simulate Login Process');
console.log('-'.repeat(80));

const testLogin = async (email, password) => {
  console.log(`\n🧪 Testing login with: ${email}`);

  // Step 1: Check if user exists
  const users = JSON.parse(localStorage.getItem('viking_demo_users') || '{}');
  const user = users[email];

  if (!user) {
    console.error(`❌ FAIL: User ${email} not found in localStorage`);
    return false;
  }
  console.log('✅ Step 1: User exists in localStorage');

  // Step 2: Check password
  if (user.password !== password) {
    console.error('❌ FAIL: Password mismatch');
    console.log(`  Expected: "${user.password}"`);
    console.log(`  Got: "${password}"`);
    return false;
  }
  console.log('✅ Step 2: Password matches');

  // Step 3: Check profile data
  if (!user.profile) {
    console.error('❌ FAIL: No profile data');
    return false;
  }
  console.log('✅ Step 3: Profile data exists');
  console.log('   Profile:', {
    id: user.profile.id,
    email: user.profile.email,
    name: `${user.profile.firstName} ${user.profile.lastName}`,
    membership: user.profile.membershipType,
  });

  return true;
};

// TEST 5: Check backend API (if running)
console.log('\n📍 TEST 5: Backend API Check');
console.log('-'.repeat(80));
fetch('http://localhost:4001/api/health')
  .then((res) => res.json())
  .then((data) => {
    console.log('✅ Backend API is responding');
    console.log('Health check:', data);
  })
  .catch((error) => {
    console.log('⚠️  Backend API not accessible (expected in demo mode)');
    console.log('Error:', error.message);
  });

// TEST 6: Check for React errors
console.log('\n📍 TEST 6: React Component State');
console.log('-'.repeat(80));
const root = document.getElementById('root');
if (root && root.innerHTML) {
  console.log('✅ React app is mounted');

  // Check if auth form is visible
  const authForm = document.querySelector('.auth-form');
  if (authForm) {
    console.log('✅ Auth form is rendered');

    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const loginButton = document.querySelector('button[type="submit"]');

    console.log('Email input:', emailInput ? '✅ Found' : '❌ Not found');
    console.log('Password input:', passwordInput ? '✅ Found' : '❌ Not found');
    console.log('Login button:', loginButton ? '✅ Found' : '❌ Not found');
  } else {
    console.log('ℹ️  Auth form not visible (might be logged in already)');
  }
} else {
  console.error('❌ React app not mounted properly');
}

// SUMMARY
console.log('\n' + '='.repeat(80));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(80));

// Final recommendations
console.log('\n💡 RECOMMENDATIONS:');
if (!storedUsers) {
  console.log('1. ❗ CRITICAL: Create a demo user account first');
  console.log('   Run: debugAuth.restoreAgilAccount("your_password")');
  console.log('   Or signup through the UI');
} else {
  const users = JSON.parse(storedUsers);
  const firstEmail = Object.keys(users)[0];
  if (firstEmail) {
    console.log(`2. Try logging in with: ${firstEmail}`);
    console.log(`   (Check the password you set when creating the account)`);
  }
}

console.log('\n🔧 QUICK FIX COMMANDS:');
console.log('To restore your account:');
console.log('  debugAuth.restoreAgilAccount("yourpassword123")');
console.log('\nTo create a new test account:');
console.log('  debugAuth.restoreUser("test@example.com", "test123")');
console.log('\nTo check all users:');
console.log('  debugAuth.checkDemoUsers()');

console.log('\n✅ DEEP TEST COMPLETE - Check results above');
