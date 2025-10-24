// delete-verified-email.js
const { supabase } = require('./supabaseClient');

async function deleteVerifiedEmail() {
  const email = 'vikingshammerxfit@gmail.com';

  console.log(`🗑️ Deleting: ${email}`);

  const { data: users, error } = await supabase
    .from('users_profile')
    .select('id, name, role')
    .eq('email', email);

  if (error || !users || users.length === 0) {
    console.log('   ℹ️  User not found');
    return;
  }

  for (const user of users) {
    console.log(`   Found: ${user.name} (${user.role})`);
    const { error: deleteError } = await supabase.from('users_profile').delete().eq('id', user.id);

    if (deleteError) {
      console.log(`   ❌ Error: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Deleted`);
    }
  }
}

deleteVerifiedEmail();
