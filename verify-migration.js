// verify-migration.js
// Verify database migrations were deployed successfully

const { supabase } = require('./supabaseClient');

async function verifyMigration() {
  console.log('🔍 Verifying database migrations...\n');

  try {
    // Check 1: invitations table exists
    console.log('📋 Checking invitations table...');
    const { data: invitationData, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1);

    if (invitationError && invitationError.code === '42P01') {
      console.log('❌ invitations table NOT found');
      console.log('   Error:', invitationError.message);
    } else if (invitationError) {
      console.log('⚠️  invitations table exists but query failed:', invitationError.message);
    } else {
      console.log('✅ invitations table exists');
      console.log(`   Current records: ${invitationData ? invitationData.length : 0}`);
    }

    // Check 2: users_profile extended columns
    console.log('\n📋 Checking users_profile columns...');
    const { data: userData, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, email, membership_type, company, join_date, last_check_in')
      .limit(1);

    if (userError) {
      console.log('❌ Extended columns check failed:', userError.message);
      if (userError.message.includes('membership_type')) {
        console.log('   Missing: membership_type');
      }
      if (userError.message.includes('company')) {
        console.log('   Missing: company');
      }
      if (userError.message.includes('join_date')) {
        console.log('   Missing: join_date');
      }
      if (userError.message.includes('last_check_in')) {
        console.log('   Missing: last_check_in');
      }
    } else {
      console.log('✅ All extended columns exist');
      console.log('   Columns verified: membership_type, company, join_date, last_check_in');
    }

    // Check 3: Get current schema for users_profile
    console.log('\n📋 Full users_profile schema:');
    const { data: allUsers, error: schemaError } = await supabase
      .from('users_profile')
      .select('*')
      .limit(1);

    if (!schemaError && allUsers && allUsers.length > 0) {
      const columns = Object.keys(allUsers[0]);
      console.log('   Columns:', columns.join(', '));
    }

    console.log('\n🎯 Verification complete!');
  } catch (error) {
    console.error('\n❌ Verification error:', error.message);
  }
}

verifyMigration();
