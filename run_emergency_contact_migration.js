// Run database migration for emergency contact fields
const { supabase } = require('./supabaseClient');

async function runMigration() {
  console.log('🔄 Adding emergency contact columns to users_profile table...');

  try {
    // Test if columns already exist by trying to select them
    const { data, error } = await supabase
      .from('users_profile')
      .select('emergency_contact_name, emergency_contact_phone, emergency_contact_country_code')
      .limit(1);

    if (!error) {
      console.log('✅ Emergency contact columns already exist!');
      console.log('Sample data:', data);
      process.exit(0);
    }

    console.log('⚠️ Columns do not exist. Please run this SQL in Supabase SQL Editor:');
    console.log('\n--- COPY AND RUN THIS SQL IN SUPABASE DASHBOARD ---\n');
    console.log(`
ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_contact_country_code VARCHAR(10) DEFAULT '+994';

COMMENT ON COLUMN public.users_profile.emergency_contact_name IS 'Emergency contact person full name';
COMMENT ON COLUMN public.users_profile.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN public.users_profile.emergency_contact_country_code IS 'Emergency contact country code prefix';
    `);
    console.log('\n--- END OF SQL ---\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

runMigration();
