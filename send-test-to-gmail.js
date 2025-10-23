// send-test-to-gmail.js
// Send a fresh test email

const { supabase } = require('./supabaseClient');
const invitationService = require('./services/invitationService');

async function sendTestEmail() {
  console.log('📧 Sending Test Email to vikingshammerxfit@gmail.com\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Find an existing user or use a test user ID
  const { data: user } = await supabase
    .from('users_profile')
    .select('*')
    .eq('email', 'vikingshammerxfit@gmail.com')
    .eq('role', 'member')
    .limit(1)
    .single();

  if (!user) {
    console.log('❌ No member user found with that email');
    return;
  }

  console.log('Found user:', user.name);
  console.log('Sending invitation email...\n');

  const result = await invitationService.sendInvitationEmail({
    email: user.email,
    token: 'test-token-' + Date.now(),
    userName: user.name,
  });

  if (result.success) {
    console.log('✅ EMAIL SENT SUCCESSFULLY!\n');
    console.log('Message ID:', result.data.id);
    console.log('\n📋 WHERE TO LOOK:\n');
    console.log('1. Gmail Inbox');
    console.log('2. Spam/Junk folder (most likely) ⚠️');
    console.log('3. Promotions tab');
    console.log('4. All Mail\n');
    console.log('Search in Gmail: from:onboarding@resend.dev\n');
  } else {
    console.log('❌ Error:', result.error);
  }
}

sendTestEmail();
