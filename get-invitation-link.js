// get-invitation-link.js
// Retrieve invitation link for a member by email

const { supabase } = require('./supabaseClient');

async function getInvitationLink(email) {
  console.log(`🔍 Looking up invitation for: ${email}\n`);

  // Find the user
  const { data: user, error: userError } = await supabase
    .from('users_profile')
    .select('*')
    .eq('email', email)
    .single();

  if (userError || !user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:');
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Status: ${user.status}\n`);

  // Find invitation
  const { data: invitations, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (invError || !invitations || invitations.length === 0) {
    console.log('⚠️  No invitation found for this user');
    console.log('   This is normal if:');
    console.log('   - User role is not "member"');
    console.log('   - User was created before invitation system was implemented');
    return;
  }

  console.log(`✅ Found ${invitations.length} invitation(s):\n`);

  invitations.forEach((inv, index) => {
    const expired = new Date(inv.expires_at) < new Date();

    console.log(`Invitation #${index + 1}:`);
    console.log(`   Token: ${inv.invitation_token}`);
    console.log(`   Status: ${inv.status} ${expired ? '(EXPIRED)' : ''}`);
    console.log(`   Created: ${new Date(inv.created_at).toLocaleString()}`);
    console.log(`   Expires: ${new Date(inv.expires_at).toLocaleString()}`);
    console.log(`   Delivery: ${inv.delivery_method || 'not set'}`);

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const registrationLink = `${appUrl}/register/${inv.invitation_token}`;

    console.log(`\n   📧 Registration Link:`);
    console.log(`   ${registrationLink}\n`);

    if (!expired && inv.status === 'pending') {
      console.log(`   ✅ This link is ACTIVE and ready to use\n`);
    } else if (expired) {
      console.log(`   ⚠️  This link has EXPIRED\n`);
    } else {
      console.log(`   ℹ️  Status: ${inv.status}\n`);
    }
  });
}

// Get email from command line or prompt
const email = process.argv[2];

if (!email) {
  console.log('Usage: node get-invitation-link.js <email>');
  console.log('Example: node get-invitation-link.js newmember@example.com');
  process.exit(1);
}

getInvitationLink(email);
