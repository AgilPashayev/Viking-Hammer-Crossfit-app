// fix_instructor_role_constraint.js
// Direct fix for instructor role database constraint

require('dotenv').config({ path: './env/.env.dev' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in env/.env.dev');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixConstraint() {
  console.log('🔧 Fixing instructor role constraint...\n');

  const sql = `
    ALTER TABLE public.users_profile 
      DROP CONSTRAINT IF EXISTS users_profile_role_check;
    
    ALTER TABLE public.users_profile 
      ADD CONSTRAINT users_profile_role_check 
      CHECK (role IN ('admin','reception','member','sparta','instructor'));
  `;

  try {
    // Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Constraint fixed successfully!\n');
    console.log('You can now assign "instructor" role to users.\n');
  } catch (error) {
    console.log('⚠️  Automatic fix not available.\n');
    console.log('📋 Please run this SQL in Supabase Dashboard:\n');
    console.log('──────────────────────────────────────────────────');
    console.log(sql.trim());
    console.log('──────────────────────────────────────────────────\n');
    console.log('📍 Steps:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Click "New Query"');
    console.log('   4. Paste the SQL above');
    console.log('   5. Click "Run" (or press Ctrl+Enter)\n');
  }

  process.exit(0);
}

fixConstraint();
