// test-backend-member-creation.js
// Test member creation via backend API to verify invitation auto-trigger

const https = require('https');
const http = require('http');

// First, we need to login as admin to get JWT token
async function loginAsAdmin() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'agil83p@gmail.com', // Vida Alis email from previous tests
      password: 'testpass123', // You'll need the actual password
    });

    const options = {
      hostname: 'localhost',
      port: 4001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          resolve(result.token);
        } else {
          console.log('Login failed:', res.statusCode, data);
          reject(new Error(`Login failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

async function createMemberViaAPI(token) {
  return new Promise((resolve, reject) => {
    const memberData = JSON.stringify({
      name: 'API Test Member',
      email: `api-test-${Date.now()}@example.com`,
      phone: '+994501234567',
      role: 'member',
      dob: '1990-01-01',
      membership_type: 'Monthly Unlimited',
    });

    const options = {
      hostname: 'localhost',
      port: 4001,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': memberData.length,
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response body:', data);

        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Member creation failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(memberData);
    req.end();
  });
}

async function checkInvitation(userId) {
  const { supabase } = require('./supabaseClient');

  console.log('\n📋 Checking for invitation...');
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 sec for trigger

  const { data, error } = await supabase.from('invitations').select('*').eq('user_id', userId);

  if (error) {
    console.log('❌ Error checking invitations:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No invitation found for user:', userId);
    return null;
  }

  console.log('✅ Invitation found!');
  console.log('   Token:', data[0].invitation_token);
  console.log('   Status:', data[0].status);
  console.log('   Expires:', data[0].expires_at);
  return data[0];
}

async function testBackendFlow() {
  console.log('🧪 Testing Backend Member Creation + Invitation Flow\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    console.log('📋 Step 1: Login as admin...');
    console.log('⚠️  NOTE: This requires valid admin credentials');
    console.log("   If login fails, we'll use direct database creation\n");

    let token;
    try {
      token = await loginAsAdmin();
      console.log('✅ Logged in successfully');
      console.log('   Token:', token.substring(0, 20) + '...\n');
    } catch (loginError) {
      console.log('⚠️  Login failed (expected if password not set)');
      console.log('   Using direct database test instead...\n');

      // Test via userService directly
      const userService = require('./services/userService');

      console.log('📋 Creating member via userService...');
      const testUser = await userService.createUser({
        name: 'Service Test Member',
        email: `service-test-${Date.now()}@example.com`,
        phone: '+994501234567',
        role: 'member',
        dob: '1990-01-01',
        membership_type: 'Monthly Unlimited',
      });

      if (!testUser.success || !testUser.data) {
        console.log('❌ Member creation failed:', testUser.error);
        return;
      }

      const userData = testUser.data;
      console.log('✅ Member created via service:', userData.id);
      console.log('   Name:', userData.name);
      console.log('   Email:', userData.email);
      console.log('   Membership:', userData.membership_type);

      const invitation = await checkInvitation(userData.id);

      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🎯 TEST RESULT');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ Member creation: WORKING');
      console.log(
        invitation
          ? '✅ Invitation auto-creation: WORKING'
          : '❌ Invitation auto-creation: NOT WORKING',
      );

      return;
    }

    console.log('📋 Step 2: Create member via API...');
    const newMember = await createMemberViaAPI(token);
    console.log('✅ Member created:', newMember);

    console.log('\n📋 Step 3: Check for invitation...');
    const invitation = await checkInvitation(newMember.user?.id || newMember.id);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 TEST RESULT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Backend API: WORKING');
    console.log('✅ Member creation: WORKING');
    console.log(
      invitation
        ? '✅ Invitation auto-creation: WORKING'
        : '❌ Invitation auto-creation: NOT WORKING',
    );
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testBackendFlow();
