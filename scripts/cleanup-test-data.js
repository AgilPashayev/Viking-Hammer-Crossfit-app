/**
 * Production-Ready Test Data Cleanup Utility
 * 
 * This script safely removes test/mock data from the database.
 * Use with caution in production environments!
 * 
 * Usage:
 *   node scripts/cleanup-test-data.js [--dry-run] [--pattern=<email_pattern>]
 * 
 * Options:
 *   --dry-run    Show what would be deleted without actually deleting
 *   --pattern    Email pattern to match (default: %test%,%mock%,%dummy%,%example%)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env/.env.dev' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const patternArg = args.find(arg => arg.startsWith('--pattern='));
const emailPattern = patternArg 
  ? patternArg.split('=')[1] 
  : '%test%,%mock%,%dummy%,%example%,%sample%';

const patterns = emailPattern.split(',');

/**
 * Find all test users matching the pattern
 */
async function findTestUsers() {
  console.log('🔍 Searching for test users with patterns:', patterns);
  
  const { data: users, error } = await supabase
    .from('users_profile')
    .select('id, email, name, role, status, created_at')
    .or(patterns.map(p => `email.ilike.${p}`).join(','));

  if (error) {
    console.error('❌ Error finding test users:', error);
    return [];
  }

  return users || [];
}

/**
 * Find all test invitations
 */
async function findTestInvitations() {
  console.log('🔍 Searching for test invitations...');
  
  const { data: invitations, error } = await supabase
    .from('invitations')
    .select('id, email, status, created_at')
    .or(patterns.map(p => `email.ilike.${p}`).join(','));

  if (error) {
    console.error('❌ Error finding test invitations:', error);
    return [];
  }

  return invitations || [];
}

/**
 * Delete user and all related data
 */
async function deleteUserData(userId, email) {
  console.log(`🗑️  Deleting user: ${email} (${userId})`);

  try {
    // Delete check-ins
    const { error: checkInsError } = await supabase
      .from('check_ins')
      .delete()
      .eq('user_id', userId);

    if (checkInsError) {
      console.error(`  ❌ Failed to delete check-ins: ${checkInsError.message}`);
    } else {
      console.log('  ✅ Deleted check-ins');
    }

    // Delete membership history
    const { error: membershipError } = await supabase
      .from('membership_history')
      .delete()
      .eq('user_id', userId);

    if (membershipError) {
      console.error(`  ❌ Failed to delete membership history: ${membershipError.message}`);
    } else {
      console.log('  ✅ Deleted membership history');
    }

    // Delete announcements created by user
    const { error: announcementsError } = await supabase
      .from('announcements')
      .delete()
      .eq('created_by', userId);

    if (announcementsError) {
      console.error(`  ❌ Failed to delete announcements: ${announcementsError.message}`);
    } else {
      console.log('  ✅ Deleted announcements');
    }

    // Delete invitations sent to user
    const { error: invitationsError } = await supabase
      .from('invitations')
      .delete()
      .eq('user_id', userId);

    if (invitationsError) {
      console.error(`  ❌ Failed to delete invitations: ${invitationsError.message}`);
    } else {
      console.log('  ✅ Deleted invitations');
    }

    // Delete user profile
    const { error: profileError } = await supabase
      .from('users_profile')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error(`  ❌ Failed to delete user profile: ${profileError.message}`);
      return false;
    } else {
      console.log('  ✅ Deleted user profile');
    }

    return true;
  } catch (error) {
    console.error(`❌ Exception deleting user ${email}:`, error);
    return false;
  }
}

/**
 * Delete orphaned invitations (no user_id)
 */
async function deleteOrphanedInvitations(invitations) {
  console.log(`🗑️  Deleting ${invitations.length} orphaned invitations...`);

  for (const invitation of invitations) {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitation.id);

    if (error) {
      console.error(`  ❌ Failed to delete invitation ${invitation.email}: ${error.message}`);
    } else {
      console.log(`  ✅ Deleted invitation: ${invitation.email}`);
    }
  }
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('='.repeat(60));
  console.log('🧹 TEST DATA CLEANUP UTILITY');
  console.log('='.repeat(60));
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE (data will be deleted!)'}`);
  console.log(`Email patterns: ${patterns.join(', ')}`);
  console.log('='.repeat(60));
  console.log();

  // Find test data
  const testUsers = await findTestUsers();
  const testInvitations = await findTestInvitations();

  // Display summary
  console.log('\n📊 SUMMARY:');
  console.log(`   Test users found: ${testUsers.length}`);
  console.log(`   Test invitations found: ${testInvitations.length}`);
  console.log();

  if (testUsers.length === 0 && testInvitations.length === 0) {
    console.log('✅ No test data found. Database is clean!');
    return;
  }

  // Show details
  if (testUsers.length > 0) {
    console.log('👥 Test Users:');
    testUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name}, role: ${user.role}, status: ${user.status})`);
    });
    console.log();
  }

  if (testInvitations.length > 0) {
    console.log('📧 Test Invitations:');
    testInvitations.forEach(inv => {
      console.log(`   - ${inv.email} (status: ${inv.status})`);
    });
    console.log();
  }

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes made');
    console.log('   Run without --dry-run to actually delete this data');
    return;
  }

  // Confirm deletion
  console.log('⚠️  WARNING: This will permanently delete all test data!');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log();

  // Delete users and their data
  let successCount = 0;
  let failCount = 0;

  for (const user of testUsers) {
    const success = await deleteUserData(user.id, user.email);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log();
  }

  // Delete orphaned invitations
  if (testInvitations.length > 0) {
    await deleteOrphanedInvitations(testInvitations);
  }

  // Final summary
  console.log('='.repeat(60));
  console.log('✅ CLEANUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`   Users deleted: ${successCount}/${testUsers.length}`);
  console.log(`   Failed deletions: ${failCount}`);
  console.log(`   Invitations cleaned: ${testInvitations.length}`);
  console.log('='.repeat(60));
}

// Run cleanup
cleanup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
