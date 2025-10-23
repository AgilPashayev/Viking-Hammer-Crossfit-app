// deploy-password-reset-table.js
// Deploys the password_reset_tokens table to Supabase

require('dotenv').config({ path: './env/.env.dev' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deployTable() {
  try {
    console.log('📦 Deploying password_reset_tokens table...\n');

    // Read SQL file
    const sql = fs.readFileSync('./create-password-reset-table.sql', 'utf8');

    console.log('SQL to execute:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('');

    console.log('⚠️  MANUAL ACTION REQUIRED:');
    console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('2. Copy the SQL above');
    console.log('3. Paste it into the SQL Editor');
    console.log('4. Click "RUN" to execute');
    console.log('');
    console.log('✅ Table will be created with:');
    console.log('   - id (bigserial primary key)');
    console.log('   - user_id (UUID foreign key to users_profile)');
    console.log('   - email (text)');
    console.log('   - token (text unique)');
    console.log('   - expires_at (timestamptz)');
    console.log('   - used (boolean)');
    console.log('   - used_at (timestamptz)');
    console.log('   - created_at (timestamptz)');
    console.log('   - Indexes on token, user_id, email, expires_at');
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployTable();
