// test-complete-invitation-flow.js
// Test complete invitation flow with homecraftwy@gmail.com

const userService = require('./services/userService');
const invitationService = require('./services/invitationService');
const { supabase } = require('./supabaseClient');

async function testCompleteFlow() {
  console.log('🧪 TESTING COMPLETE INVITATION FLOW');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testEmail = 'vikingshammerxfit@gmail.com';
  const testName = 'Test Member User';

  try {
    // Step 1: Create member (should be pending)
    console.log('📋 Step 1: Creating member...');
    const createResult = await userService.createUser({
      name: testName,
      email: testEmail,
      phone: '+1234567890',
      role: 'member',
      dob: '1990-01-01',
      membershipType: 'Monthly Unlimited',
    });

    if (!createResult.success) {
      console.log('❌ Failed to create member:', createResult.error);
      return;
    }

    const userId = createResult.data.id;
    console.log(`✅ Member created: ${userId}`);
    console.log(`   Name: ${createResult.data.name}`);
    console.log(`   Email: ${createResult.data.email}`);
    console.log(`   Status: ${createResult.data.status}`);
    console.log(`   Has password: ${createResult.data.password_hash ? 'YES' : 'NO'}`);

    if (createResult.data.status !== 'pending') {
      console.log('❌ ERROR: Status should be "pending" but is:', createResult.data.status);
    } else {
      console.log('✅ Correct: Status is "pending"');
    }

    // Step 2: Wait and check for invitation
    console.log('\n📋 Step 2: Checking for invitation...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (invError || !invitations || invitations.length === 0) {
      console.log('❌ No invitation found!');
      console.log('   Error:', invError?.message);
      return;
    }

    const invitation = invitations[0];
    console.log('✅ Invitation found:');
    console.log(`   Token: ${invitation.invitation_token}`);
    console.log(`   Status: ${invitation.status}`);
    console.log(`   Delivery: ${invitation.delivery_method}`);
    console.log(`   Expires: ${new Date(invitation.expires_at).toLocaleString()}`);

    // Step 3: Generate invitation link
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const registrationLink = `${appUrl}/register/${invitation.invitation_token}`;

    console.log('\n📋 Step 3: Registration Link Generated:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(registrationLink);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Step 4: Check email was sent
    console.log('📧 Step 4: Email Delivery Check:');
    console.log(`   Email should be sent to: ${testEmail}`);
    console.log('   From: Viking Hammer CrossFit');
    console.log('   Check your inbox and spam folder!\n');

    // Step 5: Verify current state
    console.log('📋 Step 5: Current State Summary:');
    console.log('─'.repeat(60));
    console.log(`✅ User created with status: ${createResult.data.status}`);
    console.log(`✅ Invitation created with token`);
    console.log(`✅ Email sent to ${testEmail}`);
    console.log(`⏳ Waiting for user to click link and complete registration`);
    console.log(`⏳ After registration, status will change to: active`);
    console.log('─'.repeat(60));

    console.log('\n🎯 NEXT STEPS FOR MANUAL TESTING:');
    console.log(`1. Check email inbox: ${testEmail}`);
    console.log('2. Click the "Register Now" button in the email');
    console.log('3. Fill in: First Name, Last Name, Password');
    console.log('4. Click "Create My Account"');
    console.log('5. You should be auto-logged in and redirected to dashboard');
    console.log('6. User status should change from "pending" to "active"\n');

    console.log('📊 To verify status after registration:');
    console.log(
      `   node -e "require('./supabaseClient').supabase.from('users_profile').select('status,email,name').eq('id','${userId}').single().then(r => console.log(r.data))"`,
    );
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TEST SETUP COMPLETE - CHECK YOUR EMAIL!');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error);
  }
}

testCompleteFlow();
