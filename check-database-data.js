const { supabase } = require('./supabaseClient');

async function checkDatabaseData() {
  console.log('=== CHECKING DATABASE CONTENTS ===\n');

  // Check members
  const { data: users, error: usersError } = await supabase
    .from('users_profile')
    .select('id, name, email, role, status, created_at')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.log('❌ Error fetching users:', usersError.message);
  } else {
    console.log(`📊 TOTAL MEMBERS: ${users.length}\n`);

    // Group by role
    const byRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    console.log('By Role:');
    Object.entries(byRole).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count}`);
    });

    console.log('\n📋 MEMBER LIST:\n');
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}`);
      console.log(`   Name: ${u.name || 'NULL'}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Status: ${u.status}`);
      console.log(`   Created: ${new Date(u.created_at).toLocaleString()}`);
      console.log('');
    });
  }

  // Check classes
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false });

  if (classesError) {
    console.log('❌ Error fetching classes:', classesError.message);
  } else {
    console.log(`\n📊 TOTAL CLASSES: ${classes.length}\n`);

    if (classes.length > 0) {
      console.log('📋 CLASS LIST:\n');
      classes.forEach((c, i) => {
        console.log(`${i + 1}. ${c.name}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Created: ${new Date(c.created_at).toLocaleString()}`);
        console.log('');
      });
    }
  }

  // Check if these are test data or real data
  console.log('\n=== DATA ANALYSIS ===\n');

  const testEmails = users.filter(
    (u) =>
      u.email.includes('test') ||
      u.email.includes('mock') ||
      u.email.includes('dummy') ||
      u.email.includes('example'),
  );

  const realEmails = users.filter(
    (u) =>
      !u.email.includes('test') &&
      !u.email.includes('mock') &&
      !u.email.includes('dummy') &&
      !u.email.includes('example'),
  );

  console.log(`Test/Mock members: ${testEmails.length}`);
  console.log(`Real members: ${realEmails.length}`);

  if (testEmails.length > 0) {
    console.log('\n⚠️  Found test/mock members:');
    testEmails.forEach((u) => console.log(`  - ${u.email}`));
  }

  if (realEmails.length > 0) {
    console.log('\n✅ Found real members:');
    realEmails.forEach((u) => console.log(`  - ${u.email} (${u.name})`));
  }
}

checkDatabaseData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
