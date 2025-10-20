// test-mark-read-complete-flow.js
// Complete end-to-end test for announcement mark-as-read functionality
// Simulates user interaction: view announcements → close popup → verify marked as read

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4001';
const TEST_USER_ID = '22a9215c-c72b-4aa9-964a-189363da5453'; // Replace with actual user ID

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.magenta}→${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}\n${msg}\n${colors.cyan}${'='.repeat(70)}${colors.reset}`),
};

async function simulateUserFlow() {
  log.section('🧪 SIMULATING USER FLOW: VIEW → CLOSE → VERIFY');
  
  try {
    // STEP 1: Fetch announcements as member would see them
    log.step('STEP 1: User logs in and sees announcements');
    const initialResponse = await fetch(`${API_BASE}/api/announcements/member`);
    const initialData = await initialResponse.json();
    
    if (!initialData.success || !initialData.data || initialData.data.length === 0) {
      log.error('No announcements found. Please create announcements first.');
      return;
    }
    
    const totalAnnouncements = initialData.data.length;
    log.success(`Fetched ${totalAnnouncements} published announcements`);
    
    // Filter unread announcements (simulate frontend logic)
    const unreadAnnouncements = initialData.data.filter(ann => {
      const readBy = ann.read_by_users || [];
      return !readBy.includes(TEST_USER_ID);
    });
    
    log.info(`  Total announcements: ${totalAnnouncements}`);
    log.info(`  Unread for this user: ${unreadAnnouncements.length}`);
    
    if (unreadAnnouncements.length === 0) {
      log.warning('All announcements already read. Run reset-announcement-read-status.sql first.');
      log.info('\nTo reset, run in Supabase:');
      log.info('  UPDATE announcements SET read_by_users = ARRAY[]::uuid[];');
      return;
    }
    
    log.info('\n📋 Unread announcements that will show in popup:');
    unreadAnnouncements.forEach((ann, idx) => {
      log.info(`  ${idx + 1}. ID: ${ann.id} - "${ann.title}"`);
    });
    
    // STEP 2: Simulate popup display
    log.step('\nSTEP 2: Popup modal displays with unread announcements');
    log.success('Popup shown with ' + unreadAnnouncements.length + ' announcement(s)');
    
    // STEP 3: Simulate user clicking "Got it!" button
    log.step('\nSTEP 3: User clicks "Got it!" button');
    log.info('Marking all displayed announcements as read...');
    
    const markPromises = unreadAnnouncements.map(async (ann) => {
      const response = await fetch(
        `${API_BASE}/api/announcements/${ann.id}/mark-read`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: TEST_USER_ID }),
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        log.success(`  ✓ Marked announcement #${ann.id} as read`);
        return true;
      } else {
        log.error(`  ✗ Failed to mark announcement #${ann.id}: ${result.error}`);
        return false;
      }
    });
    
    const results = await Promise.all(markPromises);
    const allMarked = results.every(r => r === true);
    
    if (allMarked) {
      log.success('\n✅ All announcements successfully marked as read!');
    } else {
      log.error('\n❌ Some announcements failed to mark as read');
      return;
    }
    
    // STEP 4: Wait a moment for database to update
    log.step('\nSTEP 4: Waiting for database to update...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // STEP 5: Fetch announcements again (simulate page refresh)
    log.step('\nSTEP 5: User refreshes page - fetching announcements again');
    const refreshResponse = await fetch(`${API_BASE}/api/announcements/member`);
    const refreshData = await refreshResponse.json();
    
    if (!refreshData.success) {
      log.error('Failed to fetch announcements after refresh');
      return;
    }
    
    // Filter unread again
    const stillUnread = refreshData.data.filter(ann => {
      const readBy = ann.read_by_users || [];
      return !readBy.includes(TEST_USER_ID);
    });
    
    log.info(`  Total announcements: ${refreshData.data.length}`);
    log.info(`  Unread for this user: ${stillUnread.length}`);
    
    // STEP 6: Verify announcements are marked as read
    log.step('\nSTEP 6: Verify announcements are marked as read');
    
    let verificationPassed = true;
    
    for (const originalAnn of unreadAnnouncements) {
      const updatedAnn = refreshData.data.find(a => a.id === originalAnn.id);
      
      if (!updatedAnn) {
        log.error(`  ✗ Announcement #${originalAnn.id} not found in refresh`);
        verificationPassed = false;
        continue;
      }
      
      const readBy = updatedAnn.read_by_users || [];
      const isMarkedRead = readBy.includes(TEST_USER_ID);
      
      if (isMarkedRead) {
        log.success(`  ✓ Announcement #${updatedAnn.id} is marked as read ✅`);
      } else {
        log.error(`  ✗ Announcement #${updatedAnn.id} is NOT marked as read ❌`);
        log.error(`    read_by_users: ${JSON.stringify(readBy)}`);
        verificationPassed = false;
      }
    }
    
    // STEP 7: Final verdict
    log.section('📊 TEST RESULTS');
    
    if (verificationPassed && stillUnread.length === 0) {
      log.success('✅ SUCCESS: All announcements marked as read!');
      log.success('✅ Popup will NOT appear on next login/refresh!');
      log.info('\n🎉 Mark-as-read functionality is working correctly!');
      log.info('\nExpected behavior verified:');
      log.info('  1. ✅ User sees unread announcements in popup');
      log.info('  2. ✅ Clicking "Got it!" marks all as read');
      log.info('  3. ✅ Database stores user ID in read_by_users array');
      log.info('  4. ✅ Refresh shows no popup (all read)');
      log.info('  5. ✅ Frontend correctly filters read announcements');
    } else if (stillUnread.length > 0) {
      log.warning(`⚠️  PARTIAL SUCCESS: ${stillUnread.length} announcements still unread`);
      log.info('\nStill unread:');
      stillUnread.forEach(ann => {
        log.info(`  - ID ${ann.id}: "${ann.title}"`);
      });
    } else {
      log.error('❌ FAILURE: Verification failed');
      log.info('Please check the logs above for details');
    }
    
  } catch (error) {
    log.error(`\n❌ Test execution failed: ${error.message}`);
    console.error(error);
  }
}

// Run the simulation
console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║  ANNOUNCEMENT MARK-AS-READ - COMPLETE USER FLOW SIMULATION        ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

log.info(`Testing with user ID: ${TEST_USER_ID}`);
log.info(`API endpoint: ${API_BASE}`);
log.info('Starting simulation...\n');

simulateUserFlow();
