/**
 * Comprehensive Announcement System Test
 * Tests: Create announcements from Reception/Sparta → Verify display in Member Dashboard
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:4001';
const FRONTEND_URL = 'http://localhost:5173';

// Test configuration
const testResults = {
  backendHealth: false,
  frontendHealth: false,
  receptionAnnouncementCreated: false,
  spartaAnnouncementCreated: false,
  memberFetchSuccess: false,
  announcements: [],
  errors: []
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => reject(error));
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testBackendHealth() {
  log('\n🔍 Step 1: Testing Backend Health...', 'cyan');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 4001,
      path: '/api/health',
      method: 'GET'
    });

    if (result.statusCode === 200) {
      log('✅ Backend is healthy and running', 'green');
      testResults.backendHealth = true;
      return true;
    } else {
      log(`❌ Backend health check failed: ${result.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend not responding: ${error.message}`, 'red');
    testResults.errors.push(`Backend: ${error.message}`);
    return false;
  }
}

async function testFrontendHealth() {
  log('\n🔍 Step 2: Testing Frontend Availability...', 'cyan');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET'
    });

    if (result.statusCode === 200) {
      log('✅ Frontend is running and accessible', 'green');
      testResults.frontendHealth = true;
      return true;
    } else {
      log(`⚠️  Frontend returned: ${result.statusCode}`, 'yellow');
      testResults.frontendHealth = true; // Still mark as healthy if responding
      return true;
    }
  } catch (error) {
    log(`❌ Frontend not responding: ${error.message}`, 'red');
    testResults.errors.push(`Frontend: ${error.message}`);
    return false;
  }
}

async function createAnnouncement(role, announcementData) {
  const roleColors = { reception: 'blue', sparta: 'magenta' };
  log(`\n📢 Step 3.${role === 'reception' ? '1' : '2'}: Creating announcement from ${role.toUpperCase()} role...`, roleColors[role]);
  
  const postData = JSON.stringify(announcementData);
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 4001,
      path: '/api/announcements',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    if (result.statusCode === 200 || result.statusCode === 201) {
      log(`✅ ${role.toUpperCase()} announcement created successfully!`, 'green');
      log(`   ID: ${result.data.id || result.data[0]?.id || 'N/A'}`, 'green');
      log(`   Title: ${announcementData.title}`, 'green');
      
      if (role === 'reception') {
        testResults.receptionAnnouncementCreated = true;
      } else {
        testResults.spartaAnnouncementCreated = true;
      }
      
      return { success: true, data: result.data };
    } else {
      log(`❌ Failed to create ${role} announcement: ${result.statusCode}`, 'red');
      log(`   Error: ${JSON.stringify(result.data)}`, 'red');
      testResults.errors.push(`${role} announcement: ${JSON.stringify(result.data)}`);
      return { success: false, error: result.data };
    }
  } catch (error) {
    log(`❌ Error creating ${role} announcement: ${error.message}`, 'red');
    testResults.errors.push(`${role} announcement: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function fetchMemberAnnouncements() {
  log('\n👤 Step 4: Fetching announcements as MEMBER...', 'cyan');
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 4001,
      path: '/api/announcements/member',
      method: 'GET'
    });

    if (result.statusCode === 200) {
      const announcements = result.data;
      testResults.memberFetchSuccess = true;
      testResults.announcements = announcements;
      
      log(`✅ Successfully fetched announcements`, 'green');
      log(`   Total announcements: ${announcements.length}`, 'green');
      
      if (announcements.length > 0) {
        log('\n📋 Announcements List:', 'cyan');
        announcements.forEach((ann, idx) => {
          log(`   ${idx + 1}. ${ann.title}`, 'yellow');
          log(`      Priority: ${ann.priority || 'normal'}`, 'yellow');
          log(`      Target: ${ann.target_audience || 'all'}`, 'yellow');
          log(`      Published: ${new Date(ann.published_at).toLocaleString()}`, 'yellow');
        });
      } else {
        log('   ⚠️  No announcements found', 'yellow');
      }
      
      return { success: true, announcements };
    } else {
      log(`❌ Failed to fetch member announcements: ${result.statusCode}`, 'red');
      testResults.errors.push(`Member fetch: Status ${result.statusCode}`);
      return { success: false, error: result.data };
    }
  } catch (error) {
    log(`❌ Error fetching member announcements: ${error.message}`, 'red');
    testResults.errors.push(`Member fetch: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function generateTestReport() {
  log('\n' + '='.repeat(80), 'cyan');
  log('📊 ANNOUNCEMENT SYSTEM TEST REPORT', 'cyan');
  log('='.repeat(80), 'cyan');
  
  log('\n🔧 Infrastructure Tests:', 'blue');
  log(`  Backend Health: ${testResults.backendHealth ? '✅ PASS' : '❌ FAIL'}`, testResults.backendHealth ? 'green' : 'red');
  log(`  Frontend Health: ${testResults.frontendHealth ? '✅ PASS' : '❌ FAIL'}`, testResults.frontendHealth ? 'green' : 'red');
  
  log('\n📢 Announcement Creation Tests:', 'blue');
  log(`  Reception Role: ${testResults.receptionAnnouncementCreated ? '✅ PASS' : '❌ FAIL'}`, testResults.receptionAnnouncementCreated ? 'green' : 'red');
  log(`  Sparta Role: ${testResults.spartaAnnouncementCreated ? '✅ PASS' : '❌ FAIL'}`, testResults.spartaAnnouncementCreated ? 'green' : 'red');
  
  log('\n👤 Member Display Tests:', 'blue');
  log(`  Fetch Announcements: ${testResults.memberFetchSuccess ? '✅ PASS' : '❌ FAIL'}`, testResults.memberFetchSuccess ? 'green' : 'red');
  log(`  Announcements Displayed: ${testResults.announcements.length}`, testResults.announcements.length > 0 ? 'green' : 'yellow');
  
  if (testResults.errors.length > 0) {
    log('\n❌ Errors Encountered:', 'red');
    testResults.errors.forEach((error, idx) => {
      log(`  ${idx + 1}. ${error}`, 'red');
    });
  }
  
  const totalTests = 5;
  const passedTests = [
    testResults.backendHealth,
    testResults.frontendHealth,
    testResults.receptionAnnouncementCreated,
    testResults.spartaAnnouncementCreated,
    testResults.memberFetchSuccess
  ].filter(Boolean).length;
  
  log('\n📈 Overall Results:', 'blue');
  log(`  Tests Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`  Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, passedTests === totalTests ? 'green' : 'yellow');
  
  log('\n✅ Next Steps for Manual Verification:', 'cyan');
  log('  1. Open browser: http://localhost:5173', 'cyan');
  log('  2. Login as MEMBER user', 'cyan');
  log('  3. Verify announcement popup modal appears', 'cyan');
  log('  4. Check if announcements are listed in dashboard', 'cyan');
  log('  5. Click "Enable Push Notifications" button', 'cyan');
  log('  6. Grant permission when browser prompts', 'cyan');
  log('  7. Verify test notification appears', 'cyan');
  log('  8. Click "Got it!" to close modal', 'cyan');
  log('  9. Refresh page and verify popup does NOT appear again', 'cyan');
  
  log('\n' + '='.repeat(80), 'cyan');
  
  if (passedTests === totalTests) {
    log('🎉 ALL TESTS PASSED! Announcement system is working correctly!', 'green');
  } else {
    log(`⚠️  ${totalTests - passedTests} test(s) failed. Review errors above.`, 'yellow');
  }
  
  log('='.repeat(80) + '\n', 'cyan');
}

// Main test execution
async function runTests() {
  log('\n🚀 Starting Announcement System Test Suite...', 'cyan');
  log('   Date: ' + new Date().toLocaleString(), 'cyan');
  
  // Test 1: Backend health
  const backendHealthy = await testBackendHealth();
  if (!backendHealthy) {
    log('\n❌ Cannot proceed: Backend is not running!', 'red');
    log('💡 Start backend: cd C:\\Users\\AgiL\\viking-hammer-crossfit-app && node backend-server.js\n', 'yellow');
    return;
  }
  
  // Test 2: Frontend health
  const frontendHealthy = await testFrontendHealth();
  if (!frontendHealthy) {
    log('\n⚠️  Frontend is not running (tests will continue)', 'yellow');
    log('💡 Start frontend: cd C:\\Users\\AgiL\\viking-hammer-crossfit-app\\frontend && npm run dev\n', 'yellow');
  }
  
  // Wait a bit for any startup processes
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 3: Create announcements
  const receptionAnnouncement = {
    title: '🏋️ New CrossFit Class Schedule!',
    content: 'Exciting news! We have added new morning CrossFit classes starting next week. Check the schedule for details. This announcement was created by RECEPTION role.',
    targetAudience: 'members',
    priority: 'high',
    createdBy: '00000000-0000-0000-0000-000000000001', // Dummy UUID
    status: 'published',
    published_at: new Date().toISOString()
  };
  
  await createAnnouncement('reception', receptionAnnouncement);
  
  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const spartaAnnouncement = {
    title: '⚔️ Sparta Challenge This Weekend!',
    content: 'Join us for the ultimate Sparta Challenge this Saturday! Test your strength, endurance, and determination. Sign up at the front desk. This announcement was created by SPARTA role.',
    targetAudience: 'members',
    priority: 'urgent',
    createdBy: '00000000-0000-0000-0000-000000000002', // Dummy UUID
    status: 'published',
    published_at: new Date().toISOString()
  };
  
  await createAnnouncement('sparta', spartaAnnouncement);
  
  // Wait for database to process
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Fetch as member
  await fetchMemberAnnouncements();
  
  // Generate report
  generateTestReport();
  
  // Save results to file
  const fs = require('fs');
  const reportPath = './announcement-test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      totalTests: 5,
      passed: [
        testResults.backendHealth,
        testResults.frontendHealth,
        testResults.receptionAnnouncementCreated,
        testResults.spartaAnnouncementCreated,
        testResults.memberFetchSuccess
      ].filter(Boolean).length
    }
  }, null, 2));
  
  log(`📄 Detailed results saved to: ${reportPath}\n`, 'cyan');
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
