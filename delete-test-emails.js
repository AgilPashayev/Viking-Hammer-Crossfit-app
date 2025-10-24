// delete-test-emails.js
// Remove specific test email addresses from database

const { supabase } = require('./supabaseClient');

async function deleteTestEmails() {
  console.log('🗑️  Deleting test email accounts...\n');

  const emailsToDelete = ['homecraftwy@gmail.com', 'agil83p@gmail.com', 'caspiautosales@gmail.com'];

  for (const email of emailsToDelete) {
    console.log(`📋 Deleting: ${email}`);

    // First, get the user to check if they exist
    const { data: users, error: findError } = await supabase
      .from('users_profile')
      .select('id, name, role, email')
      .eq('email', email);

    if (findError) {
      console.log(`   ❌ Error finding user: ${findError.message}`);
      continue;
    }

    if (!users || users.length === 0) {
      console.log(`   ℹ️  User not found (already deleted or doesn't exist)`);
      continue;
    }

    const user = users[0];
    console.log(`   Found: ${user.name || 'No name'} (${user.role})`);

    // Delete the user (CASCADE will delete related invitations)
    const { error: deleteError } = await supabase.from('users_profile').delete().eq('id', user.id);

    if (deleteError) {
      console.log(`   ❌ Error deleting: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Deleted successfully`);
    }

    console.log('');
  }

  console.log('🎯 Cleanup complete! These emails can now be used for new member registration.\n');
}

deleteTestEmails();
