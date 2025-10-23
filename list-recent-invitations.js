// list-recent-invitations.js
// Show recent invitations with links

const { supabase } = require('./supabaseClient');

async function listInvitations() {
  console.log('📧 Recent Invitations:\n');

  const { data, error } = await supabase
    .from('invitations')
    .select('email, invitation_token, status, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No invitations found.');
    console.log('\n💡 Create a new member to generate an invitation!');
    return;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  data.forEach((inv, index) => {
    const expired = new Date(inv.expires_at) < new Date();
    const status = expired && inv.status === 'pending' ? 'EXPIRED' : inv.status;

    console.log(`${index + 1}. ${inv.email}`);
    console.log(`   Status: ${status}`);
    console.log(`   Created: ${new Date(inv.created_at).toLocaleString()}`);
    console.log(`   Link: ${appUrl}/register/${inv.invitation_token}`);
    console.log('');
  });
}

listInvitations();
