const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  if (!sql.trim()) return;
  console.log('\n--- Running', filePath);
  try {
    await client.query(sql);
    console.log('OK:', filePath);
  } catch (err) {
    console.error('ERROR running', filePath);
    throw err;
  }
}

async function main() {
  const dbUrl = process.argv[2] || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('Usage: node run_sql.js <DATABASE_URL>');
    process.exit(2);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const base = path.join(__dirname);
    const migrations = [
      path.join(base, 'migrations', '0001_init.sql'),
      path.join(base, 'policies', 'rls_policies.sql'),
      path.join(base, 'seeds', 'seed_initial.sql'),
    ];

    for (const f of migrations) {
      if (fs.existsSync(f)) {
        await runFile(client, f);
      } else {
        console.warn('Skipping missing file', f);
      }
    }

    console.log('\nAll done');
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
