// execute-migration.js
// Execute database migration directly using PostgreSQL connection

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.SUPABASE_URL || 'https://nqseztalzjcfucfeljkf.supabase.co';
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];

// Supabase connection string format
// You'll need the database password - typically found in Supabase Dashboard > Settings > Database
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

async function executeMigration() {
  console.log('🚀 Executing database migration...\n');

  // Check if we have a valid connection string
  if (connectionString.includes('[YOUR-PASSWORD]')) {
    console.log('❌ DATABASE_URL not configured\n');
    console.log('📋 To execute migrations automatically, you need the database password:');
    console.log('\n1. Go to Supabase Dashboard → Settings → Database');
    console.log('2. Copy the connection string');
    console.log('3. Add to env/.env.dev:\n');
    console.log(
      '   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@[host]:6543/postgres\n',
    );
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ALTERNATIVE: Run SQL manually in Supabase SQL Editor');
    console.log('═══════════════════════════════════════════════════════════\n');

    const sql = fs.readFileSync(path.join(__dirname, 'migration-complete.sql'), 'utf-8');

    console.log(sql);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🔗 Supabase SQL Editor:');
    console.log(`https://${projectRef}.supabase.co/project/${projectRef}/sql/new\n`);

    return;
  }

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'migration-complete.sql'), 'utf-8');

    console.log('📝 Executing migration SQL...\n');

    const result = await client.query(sql);

    console.log('✅ Migration executed successfully!');
    console.log('\nResult:', result);

    console.log('\n🎯 Next step: Run verification');
    console.log('   node verify-migration.js\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);

    console.log('\n📋 FALLBACK: Run SQL manually in Supabase SQL Editor');
    console.log(`https://${projectRef}.supabase.co/project/${projectRef}/sql/new\n`);
  } finally {
    await client.end();
  }
}

executeMigration();
