// apply_instructor_role_migration.js
// Quick script to add 'instructor' role to the database CHECK constraint

require('dotenv').config({ path: './env/.env.dev' });
const { supabase } = require('./supabaseClient');

async function applyMigration() {
  console.log('🔧 Applying instructor role migration...\n');

  try {
    // Drop existing constraint and add new one with instructor role
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE public.users_profile 
          DROP CONSTRAINT IF EXISTS users_profile_role_check;
        
        ALTER TABLE public.users_profile 
          ADD CONSTRAINT users_profile_role_check 
          CHECK (role IN ('admin','reception','member','sparta','instructor'));
      `,
    });

    if (error) {
      // Try alternative approach - direct query
      console.log('⚠️  RPC method not available, trying direct SQL...\n');

      const { error: dropError } = await supabase.from('users_profile').select('id').limit(1);

      if (dropError) {
        throw new Error('Cannot connect to database');
      }

      console.log('✅ Database connection verified');
      console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
      console.log('─────────────────────────────────────────────────────────');
      console.log(`
ALTER TABLE public.users_profile 
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE public.users_profile 
  ADD CONSTRAINT users_profile_role_check 
  CHECK (role IN ('admin','reception','member','sparta','instructor'));
      `);
      console.log('─────────────────────────────────────────────────────────\n');
      console.log('📍 Go to: Supabase Dashboard → SQL Editor → New Query');
      console.log('📍 Paste the SQL above and click "Run"\n');

      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log('✅ Instructor role is now allowed in users_profile table\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`
ALTER TABLE public.users_profile 
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE public.users_profile 
  ADD CONSTRAINT users_profile_role_check 
  CHECK (role IN ('admin','reception','member','sparta','instructor'));
    `);
    console.log('─────────────────────────────────────────────────────────\n');
    console.log('📍 Go to: Supabase Dashboard → SQL Editor → New Query');
    console.log('📍 Paste the SQL above and click "Run"\n');
  }

  process.exit(0);
}

applyMigration();
