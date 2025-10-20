/**
 * Apply Announcements Table Migration
 * Executes the 20251019_announcements_complete.sql migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yxnewzmfmtwdgahbcbdq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_KEY not found in environment variables');
  console.log('\n📝 Please ensure .env file contains:');
  console.log('SUPABASE_SERVICE_KEY=your_service_role_key_here');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Starting Announcements Table Migration...\n');

  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    'infra',
    'supabase',
    'migrations',
    '20251019_announcements_complete.sql',
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Migration file loaded successfully');
  console.log(`📍 File: ${migrationPath}\n`);

  try {
    // Step 1: Check if table exists and has data
    console.log('🔍 Step 1: Checking existing announcements table...');
    const { data: existingData, error: checkError } = await supabase
      .from('announcements')
      .select('*')
      .limit(5);

    if (existingData && existingData.length > 0) {
      console.log(`⚠️  WARNING: Found ${existingData.length} existing announcements`);
      console.log('⚠️  This migration will DROP and recreate the table');
      console.log('⚠️  All existing data will be LOST!\n');
      console.log('Sample data:');
      console.log(JSON.stringify(existingData.slice(0, 2), null, 2));
      console.log('\n❌ MIGRATION ABORTED - Please backup data first!');
      console.log('\n💡 To backup: Run this in Supabase SQL Editor:');
      console.log('   CREATE TABLE announcements_backup AS SELECT * FROM announcements;');
      return;
    } else {
      console.log('✅ No existing data found - safe to proceed\n');
    }

    // Step 2: Execute migration
    console.log('🔧 Step 2: Executing migration SQL...');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.trim().startsWith('--')) continue;

      console.log(`  [${i + 1}/${statements.length}] Executing statement...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql: statement,
      });

      if (error) {
        console.error(`  ❌ Error executing statement ${i + 1}:`);
        console.error(`  ${error.message}`);
        console.error(`  Statement: ${statement.substring(0, 100)}...`);
        throw error;
      }

      console.log(`  ✅ Statement ${i + 1} executed successfully`);
    }

    console.log('\n✅ Migration completed successfully!\n');

    // Step 3: Verify new table structure
    console.log('🔍 Step 3: Verifying new table structure...');

    const { data: tableInfo, error: infoError } = await supabase
      .from('announcements')
      .select('*')
      .limit(0);

    if (infoError) {
      console.error('⚠️  Could not verify table structure:', infoError.message);
    } else {
      console.log('✅ Table verified and ready to use!');
    }

    console.log('\n🎉 Migration Complete!\n');
    console.log('📝 Next Steps:');
    console.log('  1. Test creating an announcement via Admin/Reception dashboard');
    console.log('  2. Login as member and verify popup modal appears');
    console.log('  3. Test "Enable Push Notifications" button');
    console.log('\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Alternative Method:');
    console.error(
      'Copy the SQL from infra/supabase/migrations/20251019_announcements_complete.sql',
    );
    console.error('and paste it directly into Supabase Dashboard > SQL Editor\n');
    process.exit(1);
  }
}

// Run migration
applyMigration();
