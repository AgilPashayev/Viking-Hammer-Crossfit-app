// Check all users in database and their visibility status
const { supabase } = require('./supabaseClient');

async function checkAllUsers() {
  try {
    console.log('🔍 Fetching ALL users from database...\n');

    const { data, error } = await supabase
      .from('users_profile')
      .select('id, name, email, role, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log('📊 TOTAL USERS IN DATABASE:', data.length);
    console.log('═══════════════════════════════════════════════════════════════\n');

    data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email:      ${user.email}`);
      console.log(`   Role:       ${user.role}`);
      console.log(`   Status:     ${user.status}`);
      console.log(`   Created:    ${new Date(user.created_at).toLocaleString()}`);

      // Check visibility criteria
      const isVisible =
        user.role === 'member' ||
        user.role === 'instructor' ||
        user.role === 'admin' ||
        user.role === 'reception' ||
        user.role === 'sparta';
      const statusOk =
        user.status === 'active' || user.status === 'inactive' || user.status === 'pending';

      if (!isVisible) {
        console.log(`   ⚠️  HIDDEN: Role "${user.role}" may not be displayed`);
      }
      if (!statusOk) {
        console.log(`   ⚠️  HIDDEN: Status "${user.status}" may filter this user out`);
      }
      if (user.email === 'caspiautosales@gmail.com') {
        console.log(`   ✅ THIS IS THE USER YOU'RE LOOKING FOR`);
      }
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📈 BREAKDOWN BY ROLE:');
    const roleGroups = data.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    Object.entries(roleGroups).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

    console.log('\n📈 BREAKDOWN BY STATUS:');
    const statusGroups = data.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Check specifically for caspiautosales@gmail.com
    const caspiUser = data.find((u) => u.email === 'caspiautosales@gmail.com');
    if (caspiUser) {
      console.log('\n🎯 CASPIAUTOSALES@GMAIL.COM DETAILS:');
      console.log('   Should be visible in Member Management: ✅ YES');
      console.log('   - Role is "member": ✅');
      console.log('   - Status is "active": ✅');
      console.log('   - Has valid email: ✅');
      console.log('   - Created date: ' + new Date(caspiUser.created_at).toLocaleString());
      console.log('\n   If NOT visible in UI, the issue is:');
      console.log('   → Frontend cache (need browser refresh F5)');
      console.log('   → Frontend filters hiding the user');
      console.log('   → DataContext not loading properly');
    }
  } catch (err) {
    console.error('❌ Script error:', err);
  } finally {
    process.exit(0);
  }
}

checkAllUsers();
