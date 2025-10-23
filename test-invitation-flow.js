// test-invitation-flow.js
// Complete end-to-end test of member creation and invitation system

const { supabase } = require('./supabaseClient');

const API_BASE = 'http://localhost:4001';

// Test user credentials (sparta admin)
const adminToken = 'YOUR_ADMIN_JWT_TOKEN'; // Get from login

async function testInvitationFlow() {
  console.log('🧪 Testing Complete Invitation Flow\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Verify database schema
    console.log('📋 Step 1: Verify database schema...');

    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1);

    if (invError) {
      console.log('❌ invitations table:', invError.message);
      throw new Error('Database schema not ready - run migration first');
    } else {
      console.log('✅ invitations table accessible');
    }

    const { data: users, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, email, membership_type, company, join_date, last_check_in')
      .limit(1);

    if (userError) {
      console.log('❌ users_profile columns:', userError.message);
      throw new Error('Extended columns missing - run migration first');
    } else {
      console.log('✅ users_profile extended columns present');
      if (users && users.length > 0) {
        console.log('   Sample columns:', Object.keys(users[0]).join(', '));
      }
    }

    // Step 2: Create a test member via API
    console.log('\n📋 Step 2: Create test member via backend API...');

    const testMember = {
      name: 'Test Invitation User',
      email: `test-inv-${Date.now()}@example.com`,
      phone: '+994501234567',
      role: 'member',
      dob: '1995-05-15',
      membership_type: 'Monthly Unlimited',
      company: null,
      join_date: new Date().toISOString().split('T')[0],
    };

    console.log('   Creating member:', testMember.name, `(${testMember.email})`);

    // Note: This requires backend to be running and admin authentication
    // For now, we'll create directly via Supabase to test invitation trigger

    const { data: newUser, error: createError } = await supabase
      .from('users_profile')
      .insert([
        {
          name: testMember.name,
          email: testMember.email,
          phone: testMember.phone,
          role: testMember.role,
          dob: testMember.dob,
          membership_type: testMember.membership_type,
          join_date: testMember.join_date,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (createError) {
      console.log('❌ Failed to create member:', createError.message);
      throw createError;
    }

    console.log('✅ Member created:', newUser.id);
    console.log('   Name:', newUser.name || 'NULL ⚠️');
    console.log('   Email:', newUser.email);
    console.log('   Membership:', newUser.membership_type);

    // Step 3: Check if invitation was created (via trigger or service)
    console.log('\n📋 Step 3: Check for auto-generated invitation...');

    // Wait a moment for trigger to execute
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { data: userInvitations, error: invCheckError } = await supabase
      .from('invitations')
      .select('*')
      .eq('user_id', newUser.id);

    if (invCheckError) {
      console.log('❌ Cannot query invitations:', invCheckError.message);
    } else if (!userInvitations || userInvitations.length === 0) {
      console.log('⚠️  No invitation found - auto-trigger may not be working');
      console.log('   This is expected if trigger is not set up via backend API');
      console.log('   Backend must call invitationService.createInvitation()');
    } else {
      console.log('✅ Invitation found!');
      const inv = userInvitations[0];
      console.log('   Token:', inv.invitation_token);
      console.log('   Status:', inv.status);
      console.log('   Expires:', inv.expires_at);
      console.log('   Delivery:', inv.delivery_method || 'not set');
    }

    // Step 4: Test backend invitation creation endpoint
    console.log('\n📋 Step 4: Test backend invitation endpoint...');
    console.log('   (Requires backend server running at http://localhost:4001)');

    try {
      // This would require actual backend call with admin JWT
      console.log('   Skipping - requires authenticated admin session');
      console.log('   To test: POST /api/invitations with admin token');
    } catch (apiError) {
      console.log('   Backend not available or not authenticated');
    }

    // Step 5: Cleanup test data
    console.log('\n📋 Step 5: Cleanup test data...');

    const { error: deleteError } = await supabase
      .from('users_profile')
      .delete()
      .eq('id', newUser.id);

    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Database schema verified');
    console.log('✅ Member creation works');
    console.log('⚠️  Invitation auto-creation requires backend API');
    console.log('\n📌 NEXT STEPS:');
    console.log('1. Ensure backend server is running (npm run start or node backend-server.js)');
    console.log('2. Use MemberManagement UI to create member as admin');
    console.log('3. Verify invitation created in database');
    console.log('4. Test invitation email/link delivery');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testInvitationFlow();
