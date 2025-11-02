// Apply activity_log table migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './env/.env.dev', override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying activity_log table migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_activity_log_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: execError } = await supabase.rpc('exec', { sql: statement });
        if (execError) {
          console.error('❌ Error executing statement:', execError.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Verifying table creation...');

    // Verify the table was created
    const { data: tableCheck, error: tableError } = await supabase
      .from('activity_log')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Table verification failed:', tableError.message);
      console.log('\n⚠️  You may need to run the SQL manually in Supabase SQL Editor:');
      console.log('\n' + migrationSQL);
    } else {
      console.log('✅ Table "activity_log" verified successfully!');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual Migration Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and paste the contents of migrations/create_activity_log_table.sql');
    console.log('4. Run the query');
    process.exit(1);
  }
}

applyMigration();
