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

// Restore a specific user account
export const restoreUser = (email: string, password: string, userData?: any) => {
  const stored = localStorage.getItem('viking_demo_users');
  const users = stored ? JSON.parse(stored) : {};
  
  // Use September 15, 2025 as default registration date
  const registrationDate = new Date('2025-09-15T00:00:00Z').toISOString();
  
  const defaultUserData = {
    id: crypto.randomUUID(),
    email: email,
    firstName: 'User',
    lastName: 'Account',
    phone: '0501234567',
    countryCode: '+994',
    dateOfBirth: '01-01-1990',
    gender: 'male',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactCountryCode: '+994',
    membershipType: 'Viking Warrior Pro',
    joinDate: registrationDate,
    isActive: true,
    createdAt: registrationDate,
    updatedAt: new Date().toISOString(),
  };
  
  users[email] = {
    password: password,
    profile: userData || { ...defaultUserData, email }
  };
  
  localStorage.setItem('viking_demo_users', JSON.stringify(users));
  console.log(`✅ User restored: ${email}`);
  console.log('📋 User data:', users[email]);
  return users[email];
};

// Quick restore for agil83p@yahoo.com
export const restoreAgilAccount = (password: string = 'password123') => {
  console.log('🔧 Restoring agil83p@yahoo.com account...');
  const registrationDate = new Date('2025-09-15T00:00:00Z').toISOString();
  
  return restoreUser('agil83p@yahoo.com', password, {
    id: crypto.randomUUID(), // Use UUID format
    email: 'agil83p@yahoo.com',
    firstName: 'Agil',
    lastName: 'Pashayev',
    phone: '0501234567',
    countryCode: '+994',
    dateOfBirth: '01-01-1990',
    gender: 'male',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactCountryCode: '+994',
    membershipType: 'Viking Warrior Pro',
    joinDate: registrationDate,
    isActive: true,
    createdAt: registrationDate,
    updatedAt: new Date().toISOString(),
  });
};

// Create test users with different roles
export const createTestUsers = () => {
  const stored = localStorage.getItem('viking_demo_users');
  const users = stored ? JSON.parse(stored) : {};
  const registrationDate = new Date('2025-09-15T00:00:00Z').toISOString();
  
  const testUsers = [
    {
      email: 'agil83p@yahoo.com',
      password: 'password123',
      profile: {
        id: crypto.randomUUID(),
        email: 'agil83p@yahoo.com',
        firstName: 'Agil',
        lastName: 'Pashayev',
        phone: '0501234567',
        countryCode: '+994',
        dateOfBirth: '01-01-1990',
        gender: 'male',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '0501111111',
        emergencyContactCountryCode: '+994',
        membershipType: 'Viking Warrior Pro',
        role: 'admin' as const,
        joinDate: registrationDate,
        isActive: true,
        createdAt: registrationDate,
        updatedAt: new Date().toISOString(),
      }
    },
    {
      email: 'reception@test.com',
      password: 'reception123',
      profile: {
        id: crypto.randomUUID(),
        email: 'reception@test.com',
        firstName: 'Reception',
        lastName: 'Staff',
        phone: '0502222222',
        countryCode: '+994',
        dateOfBirth: '15-05-1995',
        gender: 'female',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '0502222223',
        emergencyContactCountryCode: '+994',
        membershipType: 'Staff',
        role: 'reception' as const,
        joinDate: registrationDate,
        isActive: true,
        createdAt: registrationDate,
        updatedAt: new Date().toISOString(),
      }
    },
    {
      email: 'sparta@test.com',
      password: 'sparta123',
      profile: {
        id: crypto.randomUUID(),
        email: 'sparta@test.com',
        firstName: 'Sparta',
        lastName: 'Coach',
        phone: '0503333333',
        countryCode: '+994',
        dateOfBirth: '20-08-1988',
        gender: 'male',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '0503333334',
        emergencyContactCountryCode: '+994',
        membershipType: 'Staff',
        role: 'sparta' as const,
        joinDate: registrationDate,
        isActive: true,
        createdAt: registrationDate,
        updatedAt: new Date().toISOString(),
      }
    }
  ];
  
  let created = 0;
  let updated = 0;
  
  testUsers.forEach(user => {
    const existingUser = users[user.email];
    
    // Check if user exists with old ID format or wrong password
    if (existingUser) {
      const hasOldId = existingUser.profile?.id?.startsWith('demo-');
      const needsUpdate = hasOldId || existingUser.password !== user.password;
      
      if (needsUpdate) {
        console.log(`🔄 Updating: ${user.email} (${hasOldId ? 'old ID format' : 'password mismatch'})`);
        users[user.email] = {
          password: user.password,
          profile: user.profile
        };
        updated++;
      } else {
        console.log(`ℹ️ Already exists: ${user.email}`);
      }
    } else {
      users[user.email] = {
        password: user.password,
        profile: user.profile
      };
      created++;
      console.log(`✅ Created: ${user.email} (${user.profile.role})`);
    }
  });
  
  if (created > 0 || updated > 0) {
    localStorage.setItem('viking_demo_users', JSON.stringify(users));
    if (created > 0) console.log(`✅ ${created} test user(s) created!`);
    if (updated > 0) console.log(`✅ ${updated} test user(s) updated!`);
  }
  
  return users;
};

// Auto-create main test user on page load
export const initMainTestUser = () => {
  console.log('🔧 Initializing test users...');
  createTestUsers();
  console.log('\n📋 Available Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Admin Account:');
  console.log('   📧 Email: agil83p@yahoo.com');
  console.log('   🔑 Password: password123');
  console.log('   👤 Role: Admin (Full Access)');
  console.log('\n2. Reception Account:');
  console.log('   📧 Email: reception@test.com');
  console.log('   🔑 Password: reception123');
  console.log('   👤 Role: Reception Staff');
  console.log('\n3. Sparta Account:');
  console.log('   📧 Email: sparta@test.com');
  console.log('   🔑 Password: sparta123');
  console.log('   👤 Role: Sparta Coach');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).debugAuth = {
    checkDemoUsers,
    checkUser,
    clearDemoUsers,
    testLogin,
    restoreUser,
    restoreAgilAccount,
    createTestUsers,
    initMainTestUser
  };
  
  console.log('🛠️ Debug utilities loaded!');
  console.log('Available commands:');
  console.log('  - debugAuth.checkDemoUsers()');
  console.log('  - debugAuth.checkUser("email@example.com")');
  console.log('  - debugAuth.testLogin("email@example.com", "password")');
  console.log('  - debugAuth.restoreUser("email", "password")');
  console.log('  - debugAuth.restoreAgilAccount("your_password")');
  console.log('  - debugAuth.createTestUsers()');
  console.log('  - debugAuth.initMainTestUser()');
  console.log('  - debugAuth.clearDemoUsers()');
  
  // Auto-initialize test users on page load
  initMainTestUser();
}
