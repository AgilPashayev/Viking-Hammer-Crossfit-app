// Quick script to check caspiautosales@gmail.com user in database
const { supabase } = require('./supabaseClient');

async function checkUser() {
  try {
    console.log('🔍 Searching for user: caspiautosales@gmail.com\n');

    // Query database
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('email', 'caspiautosales@gmail.com');

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ USER NOT FOUND in database');
      console.log('\nPossible reasons:');
      console.log('1. Email exists in auth but NOT in users_profile table');
      console.log('2. User was deleted from users_profile');
      console.log('3. Typo in email address\n');
      return;
    }

    console.log('✅ USER FOUND!\n');
    console.log('User Details:');
    console.log('─────────────────────────────────────────');
    console.log(`ID:         ${data[0].id}`);
    console.log(`Name:       ${data[0].name}`);
    console.log(`Email:      ${data[0].email}`);
    console.log(`Phone:      ${data[0].phone || 'N/A'}`);
    console.log(`Role:       ${data[0].role}`);
    console.log(`Status:     ${data[0].status}`);
    console.log(`Membership: ${data[0].membership_type || 'N/A'}`);
    console.log(`Join Date:  ${data[0].join_date || 'N/A'}`);
    console.log(`Created:    ${data[0].created_at}`);
    console.log('─────────────────────────────────────────\n');

    // Check if status is 'pending' (not active)
    if (data[0].status === 'pending') {
      console.log('⚠️  ISSUE FOUND: User status is "pending"');
      console.log('   → This means the user has NOT accepted their invitation yet');
      console.log('   → Member Management may filter out "pending" users by default\n');
    }

    // Check if role is not 'member'
    if (data[0].role !== 'member') {
      console.log(`⚠️  ISSUE FOUND: User role is "${data[0].role}" (not "member")`);
      console.log('   → Member list may be filtering by role="member"\n');
    }

    // Query all users to compare
    const { data: allUsers } = await supabase
      .from('users_profile')
      .select('email, role, status')
      .order('created_at', { ascending: false });

    console.log(`\n📊 Total users in database: ${allUsers?.length || 0}`);
    console.log(
      `   - Active members: ${
        allUsers?.filter((u) => u.role === 'member' && u.status === 'active').length || 0
      }`,
    );
    console.log(
      `   - Pending members: ${
        allUsers?.filter((u) => u.role === 'member' && u.status === 'pending').length || 0
      }`,
    );
    console.log(`   - Total members: ${allUsers?.filter((u) => u.role === 'member').length || 0}`);
  } catch (err) {
    console.error('❌ Script error:', err);
  } finally {
    process.exit(0);
  }
}

checkUser();
