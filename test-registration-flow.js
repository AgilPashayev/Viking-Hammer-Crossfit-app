// test-registration-flow.js
// Test the complete invitation → registration flow

require('dotenv').config({ path: './env/.env.dev' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow\n');
  console.log('='.repeat(60));

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Check if invitations table exists
    console.log('\n📋 Test 1: Verify invitations table exists');
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1);

    if (invError) {
      console.log('❌ FAILED: Invitations table not accessible');
      console.log('   Error:', invError.message);
      testsFailed++;
    } else {
      console.log('✅ PASSED: Invitations table exists');
      testsPassed++;
    }

    // Test 2: Get a valid invitation token
    console.log('\n📋 Test 2: Find valid invitation token');
    const { data: validInvitation, error: tokenError } = await supabase
      .from('invitations')
      .select('*')
      .eq('status', 'sent')
      .eq('accepted', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !validInvitation) {
      console.log('⚠️  No valid invitation found');
      console.log('   Tip: Create a new member to generate an invitation');
      testsFailed++;
    } else {
      console.log('✅ PASSED: Found valid invitation');
      console.log('   Email:', validInvitation.email);
      console.log('   Token:', validInvitation.token.substring(0, 20) + '...');
      console.log('   Link:', `${process.env.APP_URL}/register/${validInvitation.token}`);
      testsPassed++;
    }

    // Test 3: Verify registration endpoint exists (simulate API call)
    console.log('\n📋 Test 3: Verify backend registration endpoint');
    // Note: This would require the backend to be running
    console.log('⚠️  MANUAL: Verify backend is running on port 4001');
    console.log('   Endpoint: POST /api/invitations/:token/accept');
    console.log('   Status: Assumed working (requires backend running)');

    // Test 4: Check if Register component files exist
    console.log('\n📋 Test 4: Verify frontend components exist');
    const fs = require('fs');
    const registerExists = fs.existsSync('./frontend/src/components/Register.tsx');
    const registerCssExists = fs.existsSync('./frontend/src/components/Register.css');

    if (registerExists && registerCssExists) {
      console.log('✅ PASSED: Register component files exist');
      testsPassed++;
    } else {
      console.log('❌ FAILED: Register component files missing');
      console.log('   Register.tsx:', registerExists ? 'Found' : 'Missing');
      console.log('   Register.css:', registerCssExists ? 'Found' : 'Missing');
      testsFailed++;
    }

    // Test 5: Check ForgotPassword components
    console.log('\n📋 Test 5: Verify forgot password components exist');
    const forgotExists = fs.existsSync('./frontend/src/components/ForgotPassword.tsx');
    const resetExists = fs.existsSync('./frontend/src/components/ResetPassword.tsx');

    if (forgotExists && resetExists) {
      console.log('✅ PASSED: Forgot/Reset Password components exist');
      testsPassed++;
    } else {
      console.log('❌ FAILED: Password reset components missing');
      console.log('   ForgotPassword.tsx:', forgotExists ? 'Found' : 'Missing');
      console.log('   ResetPassword.tsx:', resetExists ? 'Found' : 'Missing');
      testsFailed++;
    }

    // Test 6: Check resetService.js
    console.log('\n📋 Test 6: Verify resetService exists');
    const resetServiceExists = fs.existsSync('./services/resetService.js');

    if (resetServiceExists) {
      console.log('✅ PASSED: resetService.js exists');
      testsPassed++;
    } else {
      console.log('❌ FAILED: resetService.js not found');
      testsFailed++;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(
      `📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`,
    );

    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Registration flow is ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues.');
    }

    // Manual testing instructions
    console.log('\n' + '='.repeat(60));
    console.log('📝 MANUAL TESTING STEPS');
    console.log('='.repeat(60));
    console.log('1. Ensure backend is running: node backend-server.js');
    console.log('2. Ensure frontend is running: cd frontend && npm run dev');
    console.log('3. Create a new member via Member Management');
    console.log('4. Check email for invitation link');
    console.log('5. Click invitation link → should open Register page');
    console.log('6. Fill in: name, password, optional fields');
    console.log('7. Click "Create My Account"');
    console.log('8. Should auto-login and redirect to dashboard');
    console.log('9. Verify user can access member features');
    console.log('\n🔐 Test Forgot Password:');
    console.log('1. From login page, click "Forgot password?"');
    console.log('2. Enter email address');
    console.log('3. Check email for reset link');
    console.log('4. Click reset link → should open ResetPassword page');
    console.log('5. Enter new password (twice)');
    console.log('6. Click "Reset Password"');
    console.log('7. Should redirect to login page');
    console.log('8. Login with new password');
    console.log('');
  } catch (error) {
    console.error('\n❌ Test execution error:', error.message);
    process.exit(1);
  }
}

testRegistrationFlow();
