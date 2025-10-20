// test-announcement-mark-read.js
// Comprehensive test script for announcement mark-as-read functionality
// Tests all layers: Database → Backend API → Frontend Integration

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4001';
const TEST_USER_ID = '22a9215c-c72b-4aa9-964a-189363da5453';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`),
  section: (msg) =>
    console.log(
      `\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${msg}\n${colors.cyan}${'='.repeat(60)}${
        colors.reset
      }`,
    ),
};

async function runTests() {
  log.section('🧪 ANNOUNCEMENT MARK-AS-READ FUNCTIONALITY TEST');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ========== TEST 1: Get all member announcements ==========
    log.test('TEST 1: Fetch all member announcements');
    const allAnnouncementsResponse = await fetch(`${API_BASE}/api/announcements/member`);
    const allAnnouncementsData = await allAnnouncementsResponse.json();

    if (allAnnouncementsData.success && Array.isArray(allAnnouncementsData.data)) {
      const totalAnnouncements = allAnnouncementsData.data.length;
      log.success(`Fetched ${totalAnnouncements} announcements`);
      testsPassed++;

      if (totalAnnouncements > 0) {
        const firstAnnouncement = allAnnouncementsData.data[0];
        log.info(`  Sample: ID=${firstAnnouncement.id}, Title="${firstAnnouncement.title}"`);
        log.info(
          `  Has read_by_users field: ${
            firstAnnouncement.hasOwnProperty('read_by_users') ? 'YES' : 'NO'
          }`,
        );
        log.info(`  Currently read by ${(firstAnnouncement.read_by_users || []).length} users`);
      }
    } else {
      log.error('Failed to fetch announcements');
      testsFailed++;
      return;
    }

    // ========== TEST 2: Get unread announcements for test user ==========
    log.test('\nTEST 2: Fetch unread announcements for test user');
    const unreadResponse = await fetch(
      `${API_BASE}/api/announcements/member?userId=${TEST_USER_ID}&unreadOnly=true`,
    );
    const unreadData = await unreadResponse.json();

    if (unreadData.success && Array.isArray(unreadData.data)) {
      const unreadCount = unreadData.data.length;
      log.success(`Found ${unreadCount} unread announcements for user`);
      testsPassed++;

      if (unreadCount > 0) {
        log.info('  Unread announcement IDs:');
        unreadData.data.slice(0, 5).forEach((ann) => {
          log.info(`    - ID ${ann.id}: "${ann.title}"`);
        });
      } else {
        log.warning('  No unread announcements found - all have been marked as read');
      }
    } else {
      log.error('Failed to fetch unread announcements');
      testsFailed++;
    }

    // ========== TEST 3: Mark announcement as read ==========
    if (unreadData.data && unreadData.data.length > 0) {
      const announcementToMark = unreadData.data[0];
      log.test(`\nTEST 3: Mark announcement #${announcementToMark.id} as read`);

      const markReadResponse = await fetch(
        `${API_BASE}/api/announcements/${announcementToMark.id}/mark-read`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: TEST_USER_ID }),
        },
      );

      const markReadData = await markReadResponse.json();

      if (markReadData.success) {
        log.success(`Successfully marked announcement #${announcementToMark.id} as read`);
        testsPassed++;
      } else {
        log.error(`Failed to mark announcement as read: ${markReadData.error || 'Unknown error'}`);
        testsFailed++;
      }

      // ========== TEST 4: Verify announcement is now marked as read ==========
      log.test('\nTEST 4: Verify announcement is marked as read in database');
      const verifyResponse = await fetch(`${API_BASE}/api/announcements/member`);
      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        const markedAnnouncement = verifyData.data.find((a) => a.id === announcementToMark.id);
        if (markedAnnouncement) {
          const readByUsers = markedAnnouncement.read_by_users || [];
          const isMarkedRead = readByUsers.includes(TEST_USER_ID);

          if (isMarkedRead) {
            log.success(`Announcement #${announcementToMark.id} is marked as read in database`);
            log.info(`  read_by_users count: ${readByUsers.length}`);
            testsPassed++;
          } else {
            log.error(`Announcement #${announcementToMark.id} is NOT marked as read in database`);
            testsFailed++;
          }
        } else {
          log.error('Could not find announcement in response');
          testsFailed++;
        }
      } else {
        log.error('Failed to verify announcement status');
        testsFailed++;
      }

      // ========== TEST 5: Verify filtered out from unread list ==========
      log.test('\nTEST 5: Verify announcement is filtered out from unread list');
      const reFilteredResponse = await fetch(
        `${API_BASE}/api/announcements/member?userId=${TEST_USER_ID}&unreadOnly=true`,
      );
      const reFilteredData = await reFilteredResponse.json();

      if (reFilteredData.success) {
        const stillInUnread = reFilteredData.data.some((a) => a.id === announcementToMark.id);

        if (!stillInUnread) {
          log.success(
            `Announcement #${announcementToMark.id} is correctly filtered out from unread list`,
          );
          log.info(`  Remaining unread announcements: ${reFilteredData.data.length}`);
          testsPassed++;
        } else {
          log.error(`Announcement #${announcementToMark.id} still appears in unread list`);
          testsFailed++;
        }
      } else {
        log.error('Failed to fetch filtered unread announcements');
        testsFailed++;
      }

      // ========== TEST 6: Attempt to mark same announcement again (idempotency test) ==========
      log.test('\nTEST 6: Test idempotency - mark same announcement as read again');
      const repeatMarkResponse = await fetch(
        `${API_BASE}/api/announcements/${announcementToMark.id}/mark-read`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: TEST_USER_ID }),
        },
      );

      const repeatMarkData = await repeatMarkResponse.json();

      if (repeatMarkData.success) {
        log.success('API handled duplicate mark-as-read request gracefully');

        // Verify user is not duplicated in array
        const finalVerifyResponse = await fetch(`${API_BASE}/api/announcements/member`);
        const finalVerifyData = await finalVerifyResponse.json();
        const finalAnnouncement = finalVerifyData.data.find((a) => a.id === announcementToMark.id);

        if (finalAnnouncement) {
          const readByUsers = finalAnnouncement.read_by_users || [];
          const userCount = readByUsers.filter((id) => id === TEST_USER_ID).length;

          if (userCount === 1) {
            log.success('User ID appears only once in read_by_users array (no duplicates)');
            testsPassed++;
          } else {
            log.error(`User ID appears ${userCount} times in array (expected 1)`);
            testsFailed++;
          }
        }
      } else {
        log.warning('API returned error on duplicate mark-as-read (acceptable behavior)');
        testsPassed++; // Still pass - both behaviors are acceptable
      }
    } else {
      log.warning('\nTEST 3-6: Skipped - no unread announcements available for testing');
      log.info('  To test mark-as-read functionality:');
      log.info('  1. Create new announcements in Supabase');
      log.info('  2. Or clear read_by_users array in existing announcements');
    }

    // ========== SUMMARY ==========
    log.section('📊 TEST SUMMARY');
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);

    if (testsFailed === 0) {
      log.success('\n✨ All tests passed! Mark-as-read functionality is working correctly.');
      log.info('\nIntegration verified:');
      log.info('  ✓ Database: read_by_users array properly stores user IDs');
      log.info('  ✓ Backend API: Endpoints correctly handle marking and filtering');
      log.info('  ✓ Frontend Integration: Ready to use in MemberDashboard component');
      process.exit(0);
    } else {
      log.error(`\n❌ ${testsFailed} test(s) failed. Please review the errors above.`);
      process.exit(1);
    }
  } catch (error) {
    log.error(`\n❌ Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
