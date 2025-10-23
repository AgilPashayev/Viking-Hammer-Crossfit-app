// Run pending Supabase migrations
const { supabase } = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🔄 Running Supabase migrations...\n');

  const migrationsDir = path.join(__dirname, 'infra', 'supabase', 'migrations');
  const migrations = ['20251019_invitations.sql', '20251022_extend_users_profile.sql'];

  for (const migrationFile of migrations) {
    const filePath = path.join(migrationsDir, migrationFile);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Migration not found: ${migrationFile}`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 Executing: ${migrationFile}`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        console.error(`❌ Error in ${migrationFile}:`, error);
      } else {
        console.log(`✅ ${migrationFile} executed successfully`);
      }
    } catch (error) {
      console.error(`❌ Failed to execute ${migrationFile}:`, error.message);
    }

    console.log('');
  }

  console.log('✅ Migration process complete');
}

runMigrations();
