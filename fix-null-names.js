// fix-null-names.js
// Fix NULL name fields for existing members

const { supabase } = require('./supabaseClient');

async function fixNullNames() {
  console.log('🔧 Fixing NULL name fields...\n');

  // Find users with NULL names
  const { data: usersWithNullNames, error } = await supabase
    .from('users_profile')
    .select('*')
    .is('name', null);

  if (error) {
    console.error('❌ Error querying users:', error.message);
    return;
  }

  if (!usersWithNullNames || usersWithNullNames.length === 0) {
    console.log('✅ No users with NULL names found');
    return;
  }

  console.log(`Found ${usersWithNullNames.length} users with NULL names:\n`);

  for (const user of usersWithNullNames) {
    console.log(`📋 User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current name: ${user.name}`);

    // Try to extract name from email or set placeholder
    let fixedName = 'Unknown User';

    if (user.email) {
      // Try to get name from email (before @)
      const emailPart = user.email.split('@')[0];
      // Capitalize first letter
      fixedName = emailPart
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    console.log(`   Proposed fix: ${fixedName}`);

    // Update the user
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ name: fixedName })
      .eq('id', user.id);

    if (updateError) {
      console.log(`   ❌ Failed to update: ${updateError.message}`);
    } else {
      console.log(`   ✅ Updated successfully`);
    }
    console.log('');
  }

  console.log('🎯 Name fix complete!');
}

fixNullNames();
