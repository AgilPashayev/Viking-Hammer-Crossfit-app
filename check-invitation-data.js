// check-invitation-data.js
// Check what data is returned from invitation validation

const { supabase } = require('./supabaseClient');

async function checkInvitationData() {
  console.log('🔍 Checking invitation data structure...\n');

  const { data, error } = await supabase
    .from('invitations')
    .select('*, users_profile(*)')
    .eq('email', 'vikingshammerxfit@gmail.com')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('📋 Invitation Data:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n📋 User Profile Data:');
  console.log(JSON.stringify(data.users_profile, null, 2));

  console.log('\n🎯 Key Fields:');
  console.log('  - User Name:', data.users_profile?.name);
  console.log('  - User Email:', data.users_profile?.email);
  console.log('  - User Phone:', data.users_profile?.phone);
  console.log('  - User Status:', data.users_profile?.status);
  console.log('  - Has Password:', data.users_profile?.password_hash ? 'YES' : 'NO');
}

checkInvitationData();
