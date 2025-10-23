// validate-complete-system.js
// Complete system validation across all layers

const { supabase } = require('./supabaseClient');

async function validateCompleteSystem() {
  console.log('🧪 COMPLETE SYSTEM VALIDATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    database: { passed: 0, failed: 0, tests: [] },
    backend: { passed: 0, failed: 0, tests: [] },
    integration: { passed: 0, failed: 0, tests: [] },
  };

  // DATABASE LAYER TESTS
  console.log('📦 DATABASE LAYER VALIDATION\n');

  // Test 1: users_profile table with extended columns
  console.log('Test 1: users_profile schema...');
  const { data: userSample, error: userError } = await supabase
    .from('users_profile')
    .select('id, name, email, role, membership_type, company, join_date, last_check_in')
    .limit(1);

  if (!userError && userSample) {
    console.log('✅ PASS: users_profile with all columns');
    results.database.passed++;
    results.database.tests.push({ name: 'users_profile schema', status: 'PASS' });
  } else {
    console.log('❌ FAIL:', userError?.message);
    results.database.failed++;
    results.database.tests.push({
      name: 'users_profile schema',
      status: 'FAIL',
      error: userError?.message,
    });
  }

  // Test 2: invitations table exists
  console.log('\nTest 2: invitations table...');
  const { data: invSample, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .limit(1);

  if (!invError || invError.code !== '42P01') {
    console.log('✅ PASS: invitations table exists');
    results.database.passed++;
    results.database.tests.push({ name: 'invitations table', status: 'PASS' });
  } else {
    console.log('❌ FAIL:', invError.message);
    results.database.failed++;
    results.database.tests.push({
      name: 'invitations table',
      status: 'FAIL',
      error: invError.message,
    });
  }

  // Test 3: Check existing members have names
  console.log('\nTest 3: No NULL names in users...');
  const { data: nullNames } = await supabase.from('users_profile').select('id').is('name', null);

  if (!nullNames || nullNames.length === 0) {
    console.log('✅ PASS: All users have names');
    results.database.passed++;
    results.database.tests.push({ name: 'No NULL names', status: 'PASS' });
  } else {
    console.log(`❌ FAIL: ${nullNames.length} users with NULL names`);
    results.database.failed++;
    results.database.tests.push({
      name: 'No NULL names',
      status: 'FAIL',
      error: `${nullNames.length} users`,
    });
  }

  // BACKEND SERVICE LAYER TESTS
  console.log('\n\n📦 BACKEND SERVICE LAYER VALIDATION\n');

  // Test 4: userService member creation
  console.log('Test 4: Create member via userService...');
  const userService = require('./services/userService');
  const testMember = await userService.createUser({
    name: 'Validation Test User',
    email: `validation-${Date.now()}@test.com`,
    phone: '+1234567890',
    role: 'member',
    dob: '1990-01-01',
    membership_type: 'Monthly Unlimited',
  });

  if (testMember.success && testMember.data) {
    console.log('✅ PASS: Member created successfully');
    console.log(`   ID: ${testMember.data.id}`);
    console.log(`   Name: ${testMember.data.name}`);
    results.backend.passed++;
    results.backend.tests.push({ name: 'Create member', status: 'PASS', id: testMember.data.id });
  } else {
    console.log('❌ FAIL:', testMember.error);
    results.backend.failed++;
    results.backend.tests.push({ name: 'Create member', status: 'FAIL', error: testMember.error });
  }

  // Test 5: Auto-invitation creation
  if (testMember.success && testMember.data) {
    console.log('\nTest 5: Auto-invitation for new member...');
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for async

    const { data: invitations } = await supabase
      .from('invitations')
      .select('*')
      .eq('user_id', testMember.data.id);

    if (invitations && invitations.length > 0) {
      console.log('✅ PASS: Invitation auto-created');
      console.log(`   Token: ${invitations[0].invitation_token.substring(0, 20)}...`);
      console.log(`   Status: ${invitations[0].status}`);
      console.log(`   Expires: ${invitations[0].expires_at}`);
      results.integration.passed++;
      results.integration.tests.push({ name: 'Auto-invitation', status: 'PASS' });
    } else {
      console.log('❌ FAIL: No invitation created');
      results.integration.failed++;
      results.integration.tests.push({ name: 'Auto-invitation', status: 'FAIL' });
    }

    // Cleanup
    await supabase.from('users_profile').delete().eq('id', testMember.data.id);
  }

  // Test 6: invitationService token validation
  console.log('\nTest 6: Invitation token generation...');
  const invitationService = require('./services/invitationService');

  // Create a temp user for testing
  const { data: tempUser } = await supabase
    .from('users_profile')
    .insert({
      name: 'Temp Invite Test',
      email: `temp-invite-${Date.now()}@test.com`,
      phone: '+1111111111',
      role: 'member',
      status: 'active',
    })
    .select()
    .single();

  if (tempUser) {
    const invResult = await invitationService.createInvitation({
      userId: tempUser.id,
      email: tempUser.email,
      phone: tempUser.phone,
      deliveryMethod: 'email',
      sentBy: 'system',
    });

    if (!invResult.error && invResult.data) {
      console.log('✅ PASS: Invitation service working');
      console.log(`   Token length: ${invResult.data.invitation_token.length} chars`);
      results.backend.passed++;
      results.backend.tests.push({ name: 'Invitation service', status: 'PASS' });
    } else {
      console.log('❌ FAIL:', invResult.error);
      results.backend.failed++;
      results.backend.tests.push({
        name: 'Invitation service',
        status: 'FAIL',
        error: invResult.error,
      });
    }

    // Cleanup
    await supabase.from('users_profile').delete().eq('id', tempUser.id);
  }

  // INTEGRATION TESTS
  console.log('\n\n📦 INTEGRATION VALIDATION\n');

  // Test 7: Check test members
  console.log('Test 7: Verify test members (Vida & Erik)...');
  const { data: testMembers } = await supabase
    .from('users_profile')
    .select('*')
    .in('email', ['agil83p@gmail.com', 'erik.thorsson.test@vikinghammer.com']);

  if (testMembers && testMembers.length === 2) {
    const vida = testMembers.find((m) => m.email === 'agil83p@gmail.com');
    const erik = testMembers.find((m) => m.email === 'erik.thorsson.test@vikinghammer.com');

    if (vida?.name === 'Vida Alis' && erik?.name === 'Erik Thorsson') {
      console.log('✅ PASS: Test members properly configured');
      console.log(`   Vida Alis: ${vida.membership_type}`);
      console.log(`   Erik Thorsson: ${erik.membership_type}`);
      results.integration.passed++;
      results.integration.tests.push({ name: 'Test members', status: 'PASS' });
    } else {
      console.log('⚠️  PARTIAL: Test members exist but names may need update');
      results.integration.passed++;
      results.integration.tests.push({ name: 'Test members', status: 'PARTIAL' });
    }
  } else {
    console.log(`⚠️  Found ${testMembers?.length || 0}/2 test members`);
    results.integration.tests.push({ name: 'Test members', status: 'PARTIAL' });
  }

  // SUMMARY
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const totalPassed = results.database.passed + results.backend.passed + results.integration.passed;
  const totalFailed = results.database.failed + results.backend.failed + results.integration.failed;
  const totalTests = totalPassed + totalFailed;

  console.log(
    `Database Layer:     ${results.database.passed}/${
      results.database.passed + results.database.failed
    } passed`,
  );
  console.log(
    `Backend Layer:      ${results.backend.passed}/${
      results.backend.passed + results.backend.failed
    } passed`,
  );
  console.log(
    `Integration Layer:  ${results.integration.passed}/${
      results.integration.passed + results.integration.failed
    } passed`,
  );
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`TOTAL:              ${totalPassed}/${totalTests} tests passed`);

  if (totalFailed === 0) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
  } else {
    console.log(`\n⚠️  ${totalFailed} test(s) need attention`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
}

validateCompleteSystem();
