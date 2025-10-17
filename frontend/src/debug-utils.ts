/**
 * DEBUG UTILITIES
 * 
 * Quick debugging functions to help troubleshoot authentication issues
 * Open browser console (F12) and paste these commands
 */

// Check all demo users
export const checkDemoUsers = () => {
  const stored = localStorage.getItem('viking_demo_users');
  if (!stored) {
    console.log('❌ No demo users found in localStorage');
    return null;
  }
  
  try {
    const users = JSON.parse(stored);
    console.log('✅ Found demo users:', Object.keys(users));
    console.log('📋 Full data:', users);
    return users;
  } catch (error) {
    console.error('❌ Error parsing demo users:', error);
    return null;
  }
};

// Check specific user
export const checkUser = (email: string) => {
  const users = checkDemoUsers();
  if (!users) return null;
  
  const user = users[email];
  if (!user) {
    console.log(`❌ User not found: ${email}`);
    return null;
  }
  
  console.log(`✅ User found: ${email}`);
  console.log('📋 User data:', {
    email: user.profile.email,
    name: `${user.profile.firstName} ${user.profile.lastName}`,
    membership: user.profile.membershipType,
    hasPassword: !!user.password
  });
  return user;
};

// Clear all demo users (use with caution!)
export const clearDemoUsers = () => {
  const confirmed = confirm('⚠️ This will delete all demo user accounts. Are you sure?');
  if (confirmed) {
    localStorage.removeItem('viking_demo_users');
    console.log('✅ Demo users cleared');
  }
};

// Test login without UI
export const testLogin = async (email: string, password: string) => {
  console.log('🔍 Testing login...');
  
  const users = checkDemoUsers();
  if (!users) {
    console.log('❌ No users in storage');
    return false;
  }
  
  const user = users[email];
  if (!user) {
    console.log(`❌ User not found: ${email}`);
    console.log('Available users:', Object.keys(users));
    return false;
  }
  
  if (user.password !== password) {
    console.log('❌ Password mismatch');
    console.log('Stored password length:', user.password.length);
    console.log('Provided password length:', password.length);
    return false;
  }
  
  console.log('✅ Login would succeed!');
  console.log('User profile:', user.profile);
  return true;
};

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).debugAuth = {
    checkDemoUsers,
    checkUser,
    clearDemoUsers,
    testLogin
  };
  
  console.log('🛠️ Debug utilities loaded!');
  console.log('Available commands:');
  console.log('  - debugAuth.checkDemoUsers()');
  console.log('  - debugAuth.checkUser("email@example.com")');
  console.log('  - debugAuth.testLogin("email@example.com", "password")');
  console.log('  - debugAuth.clearDemoUsers()');
}
