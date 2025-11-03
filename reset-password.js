// Reset password for agil83p@gmail.com
const bcrypt = require('bcrypt');
const { supabase } = require('./supabaseClient');

async function resetPassword() {
  const email = 'agil83p@gmail.com';
  const newPassword = 'Admin123!'; // New password

  try {
    console.log(`🔄 Resetting password for ${email}...`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update in database
    const { data, error } = await supabase
      .from('users_profile')
      .update({ password_hash: hashedPassword })
      .eq('email', email)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Password reset successful!');
      console.log('\n📧 Email:', email);
      console.log('🔑 New Password:', newPassword);
      console.log('\n⚠️  Please change this password after logging in.');
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('💥 Exception:', error);
  }

  process.exit(0);
}

resetPassword();
