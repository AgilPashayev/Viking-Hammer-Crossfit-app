const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'env', '.env.dev'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMetadataColumnDirectSQL() {
  console.log('🔄 Adding metadata column to plans table via SQL...\n');

  try {
    // Execute SQL directly to add column
    const sql = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'plans' AND column_name = 'metadata'
        ) THEN
          ALTER TABLE plans ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
          RAISE NOTICE 'Added metadata column to plans table';
        ELSE
          RAISE NOTICE 'metadata column already exists in plans table';
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_plans_metadata ON plans USING gin(metadata);
    `;

    // Use the SQL directly through a raw query
    // Since Supabase doesn't allow DDL through the client, we'll populate with default values instead
    console.log('⚠️  Cannot run DDL commands through Supabase client.');
    console.log('📌  Solution: We will work WITHOUT the metadata column.');
    console.log('    The frontend will fallback to using basic plan fields only.\n');

    console.log('📊 Step 1: Checking existing plans...');
    const { data: plans, error: fetchError } = await supabase.from('plans').select('*').order('id');

    if (fetchError) {
      console.error('❌ Failed to fetch plans:', fetchError.message);
      process.exit(1);
    }

    if (!plans || plans.length === 0) {
      console.log('⚠️  No plans found in database!');
      console.log('📌  Please run: node run_migration_fix_membership.js first');
      process.exit(1);
    }

    console.log(`✅ Found ${plans.length} plans in database:\n`);
    plans.forEach((plan) => {
      const visits = plan.visit_quota ? `${plan.visit_quota} visits` : 'Unlimited';
      console.log(
        `  • ${plan.name}: ${plan.price_cents / 100} AZN | ${plan.duration_days} days | ${visits}`,
      );
    });

    console.log('\n📌 SOLUTION: Frontend Code Fix');
    console.log('Since we cannot add the metadata column programmatically,');
    console.log('we will update the frontend to work WITHOUT metadata.\n');

    console.log('The frontend will use these mappings:');
    console.log('  • plan.name → Display name');
    console.log('  • plan.price_cents / 100 → Price');
    console.log('  • plan.duration_days → Duration');
    console.log('  • plan.visit_quota → Entry limit (null = unlimited)');
    console.log('  • Infer type from name and visit_quota\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

addMetadataColumnDirectSQL();
