// Quick CRUD Test Script
require('dotenv').config({ path: './env/.env.dev' });
const { supabase } = require('./supabaseClient');
const bcrypt = require('bcrypt');

async function runTests() {
  console.log('\n🧪 STARTING COMPREHENSIVE CRUD TESTS\n');
  console.log('='.repeat(60));

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: [],
  };

  // TEST 1: Database Connection
  console.log('\n📊 TEST 1: Database Connection');
  try {
    const { data, error } = await supabase.from('users_profile').select('count');
    if (error) throw error;
    testResults.passed++;
    testResults.tests.push({ name: 'Database Connection', status: '✅ PASS' });
    console.log('✅ PASS - Database connected');
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'Database Connection',
      status: '❌ FAIL',
      error: error.message,
    });
    console.log('❌ FAIL:', error.message);
  }
  testResults.total++;

  // TEST 2: Create Member (INSERT)
  console.log('\n📊 TEST 2: CREATE Member');
  let testMember = null;
  try {
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    const { data, error } = await supabase
      .from('users_profile')
      .insert({
        name: 'Test Member User',
        email: `testmember${Date.now()}@test.com`,
        role: 'member',
        password_hash: hashedPassword,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    testMember = data;
    testResults.passed++;
    testResults.tests.push({ name: 'Create Member', status: '✅ PASS', id: data.id });
    console.log('✅ PASS - Member created:', data.id);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: 'Create Member', status: '❌ FAIL', error: error.message });
    console.log('❌ FAIL:', error.message);
  }
  testResults.total++;

  // TEST 3: Read Member (SELECT)
  console.log('\n📊 TEST 3: READ Member');
  if (testMember) {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', testMember.id)
        .single();

      if (error) throw error;
      testResults.passed++;
      testResults.tests.push({ name: 'Read Member', status: '✅ PASS' });
      console.log('✅ PASS - Member retrieved');
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({ name: 'Read Member', status: '❌ FAIL', error: error.message });
      console.log('❌ FAIL:', error.message);
    }
  } else {
    testResults.failed++;
    testResults.tests.push({ name: 'Read Member', status: '⏭️  SKIP - No member to read' });
    console.log('⏭️  SKIP - No member created');
  }
  testResults.total++;

  // TEST 4: Update Member (UPDATE)
  console.log('\n📊 TEST 4: UPDATE Member');
  if (testMember) {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .update({ name: 'Updated Test Member', phone: '+994501234567' })
        .eq('id', testMember.id)
        .select()
        .single();

      if (error) throw error;
      testResults.passed++;
      testResults.tests.push({ name: 'Update Member', status: '✅ PASS' });
      console.log('✅ PASS - Member updated');
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({ name: 'Update Member', status: '❌ FAIL', error: error.message });
      console.log('❌ FAIL:', error.message);
    }
  } else {
    testResults.failed++;
    testResults.tests.push({ name: 'Update Member', status: '⏭️  SKIP' });
    console.log('⏭️  SKIP - No member created');
  }
  testResults.total++;

  // TEST 5: Create Instructor
  console.log('\n📊 TEST 5: CREATE Instructor');
  let testInstructor = null;
  try {
    const { data, error } = await supabase
      .from('instructors')
      .insert({
        first_name: 'Test',
        last_name: 'Instructor',
        email: `instructor${Date.now()}@test.com`,
        phone: '+994501111111',
        specialties: ['CrossFit', 'HIIT'],
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    testInstructor = data;
    testResults.passed++;
    testResults.tests.push({ name: 'Create Instructor', status: '✅ PASS', id: data.id });
    console.log('✅ PASS - Instructor created:', data.id);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: 'Create Instructor', status: '❌ FAIL', error: error.message });
    console.log('❌ FAIL:', error.message);
  }
  testResults.total++;

  // TEST 6: Create Class
  console.log('\n📊 TEST 6: CREATE Class');
  let testClass = null;
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: 'Test CrossFit WOD',
        description: 'Test workout of the day',
        duration_minutes: 60,
        difficulty: 'Intermediate',
        max_capacity: 20,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    testClass = data;
    testResults.passed++;
    testResults.tests.push({ name: 'Create Class', status: '✅ PASS', id: data.id });
    console.log('✅ PASS - Class created:', data.id);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: 'Create Class', status: '❌ FAIL', error: error.message });
    console.log('❌ FAIL:', error.message);
  }
  testResults.total++;

  // TEST 7: Read All Classes
  console.log('\n📊 TEST 7: READ All Classes');
  try {
    const { data, error } = await supabase.from('classes').select('*');

    if (error) throw error;
    testResults.passed++;
    testResults.tests.push({ name: 'Read All Classes', status: '✅ PASS', count: data.length });
    console.log('✅ PASS - Retrieved', data.length, 'classes');
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: 'Read All Classes', status: '❌ FAIL', error: error.message });
    console.log('❌ FAIL:', error.message);
  }
  testResults.total++;

  // TEST 8: Update Class
  console.log('\n📊 TEST 8: UPDATE Class');
  if (testClass) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({ name: 'Updated Test WOD', max_capacity: 25 })
        .eq('id', testClass.id)
        .select()
        .single();

      if (error) throw error;
      testResults.passed++;
      testResults.tests.push({ name: 'Update Class', status: '✅ PASS' });
      console.log('✅ PASS - Class updated');
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({ name: 'Update Class', status: '❌ FAIL', error: error.message });
      console.log('❌ FAIL:', error.message);
    }
  } else {
    testResults.failed++;
    testResults.tests.push({ name: 'Update Class', status: '⏭️  SKIP' });
    console.log('⏭️  SKIP - No class created');
  }
  testResults.total++;

  // TEST 9: Delete Instructor
  console.log('\n📊 TEST 9: DELETE Instructor');
  if (testInstructor) {
    try {
      const { error } = await supabase.from('instructors').delete().eq('id', testInstructor.id);

      if (error) throw error;
      testResults.passed++;
      testResults.tests.push({ name: 'Delete Instructor', status: '✅ PASS' });
      console.log('✅ PASS - Instructor deleted');
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({
        name: 'Delete Instructor',
        status: '❌ FAIL',
        error: error.message,
      });
      console.log('❌ FAIL:', error.message);
    }
  } else {
    testResults.failed++;
    testResults.tests.push({ name: 'Delete Instructor', status: '⏭️  SKIP' });
    console.log('⏭️  SKIP - No instructor created');
  }
  testResults.total++;

  // TEST 10: Delete Class
  console.log('\n📊 TEST 10: DELETE Class');
  if (testClass) {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', testClass.id);

      if (error) throw error;
      testResults.passed++;
      testResults.tests.push({ name: 'Delete Class', status: '✅ PASS' });
      console.log('✅ PASS - Class deleted');
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({ name: 'Delete Class', status: '❌ FAIL', error: error.message });
      console.log('❌ FAIL:', error.message);
    }
  } else {
    testResults.failed++;
    testResults.tests.push({ name: 'Delete Class', status: '⏭️  SKIP' });
    console.log('⏭️  SKIP - No class created');
  }
  testResults.total++;

  // TEST 11: Delete Member
  console.log('\n📊 TEST 11: DELETE Member');
  if (testMember) {
    try {
      const { error } = await supabase.from('users_profile').delete().eq('id', testMember.id);

      if (error) throw error;
      testResults.passed++;
      testResults.tests.push({ name: 'Delete Member', status: '✅ PASS' });
      console.log('✅ PASS - Member deleted');
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({ name: 'Delete Member', status: '❌ FAIL', error: error.message });
      console.log('❌ FAIL:', error.message);
    }
  } else {
    testResults.failed++;
    testResults.tests.push({ name: 'Delete Member', status: '⏭️  SKIP' });
    console.log('⏭️  SKIP - No member created');
  }
  testResults.total++;

  // FINAL REPORT
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(60));
  console.log('TEST DETAILS:');
  testResults.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}: ${test.status}`);
    if (test.id) console.log(`   ID: ${test.id}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    if (test.count !== undefined) console.log(`   Count: ${test.count}`);
  });
  console.log('='.repeat(60));

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('❌ TEST SUITE FAILED:', error);
  process.exit(1);
});
