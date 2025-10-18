// supabaseClient.js
// Supabase client configuration and initialization

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env/.env.dev' });

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'REPLACE' || supabaseKey === 'REPLACE') {
  console.error('❌ ERROR: Supabase credentials not configured!');
  console.error('Please update env/.env.dev with your Supabase URL and KEY');
  console.error('Current SUPABASE_URL:', supabaseUrl);
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users_profile').select('count').limit(1);

    if (error) {
      console.warn('⚠️  Supabase connection test warning:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    return false;
  }
}

module.exports = { supabase, testConnection };
