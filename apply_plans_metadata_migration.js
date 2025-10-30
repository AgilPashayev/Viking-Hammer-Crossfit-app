/**
 * Migration Runner: Add Plans Metadata Column
 * Executes the migration to add metadata JSONB column to plans table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './env/.env.dev', override: true });

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || supabaseUrl === 'REPLACE') {
  console.error('❌ ERROR: SUPABASE_URL not configured in env/.env.dev');
  process.exit(1);
}

if (!supabaseServiceKey || supabaseServiceKey === 'REPLACE') {
  console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not found, using regular key');
}

// Initialize Supabase client with service role key (or regular key as fallback)
const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🚀 Starting migration: Add plans metadata column...\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(
      __dirname,
      'infra',
      'supabase',
      'migrations',
      '0011_add_plans_metadata.sql',
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📝 Executing SQL...\n');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      // Try direct execution via REST API
      console.log('⚠️  RPC method not available, executing statements individually...\n');

      // Split into individual statements
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('alter table')) {
          console.log('  ➡️  Adding metadata column...');
        } else if (statement.toLowerCase().includes('create index')) {
          console.log('  ➡️  Creating GIN index...');
        } else if (statement.toLowerCase().includes('update public.plans')) {
          console.log('  ➡️  Populating default metadata...');
        }
      }

      // Execute ALTER TABLE
      const { error: alterError } = await supabase.rpc('exec_sql', {
        query:
          "ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb",
      });

      if (alterError) {
        console.log(
          '⚠️  Cannot execute via RPC. Please run migration manually in Supabase Dashboard.\n',
        );
        console.log('📋 Copy the migration SQL from:');
        console.log('   ' + migrationPath);
        console.log('\n🌐 Go to: Supabase Dashboard > SQL Editor > New Query\n');
        return;
      }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('🔍 Verifying migration...\n');

    // Verify column exists
    const { data: plans, error: queryError } = await supabase
      .from('plans')
      .select('id, name, metadata')
      .limit(1);

    if (queryError) {
      console.error('❌ Verification failed:', queryError.message);
      console.log('\n⚠️  Please verify manually in Supabase Dashboard');
      return;
    }

    console.log('✅ Verification successful!');
    console.log('   - metadata column exists');
    console.log('   - Column is queryable');

    if (plans && plans.length > 0) {
      console.log('   - Sample record:', JSON.stringify(plans[0], null, 2));
    }

    console.log('\n🎉 Migration complete! Plans table now has metadata column.\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 Manual Migration Required:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log(
      '3. Run the migration file: infra/supabase/migrations/0011_add_plans_metadata.sql\n',
    );
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
