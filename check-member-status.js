// Quick script to check member status in database
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'env', '.env.dev') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMemberStatus() {
  console.log('\n📊 Checking member statuses in database...\n');

  const { data, error } = await supabase
    .from('users_profile')
    .select('id, name, email, role, status, password_hash, created_at')
    .eq('role', 'member')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('Latest 10 members:\n');
  data.forEach((member, index) => {
    const hasPassword = !!member.password_hash;
    const statusIcon =
      member.status === 'pending'
        ? '🟡'
        : member.status === 'active'
        ? '🟢'
        : member.status === 'suspended'
        ? '🔴'
        : '⚪';

    console.log(`${index + 1}. ${statusIcon} ${member.name || 'No name'}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Status: ${member.status || 'NULL'}`);
    console.log(`   Has Password: ${hasPassword ? 'Yes (Registered)' : 'No (Invitation sent)'}`);
    console.log(`   Created: ${new Date(member.created_at).toLocaleString()}`);
    console.log('');
  });
}

checkMemberStatus().then(() => process.exit(0));
