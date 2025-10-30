const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'env', '.env.dev'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMetadataColumn() {
  console.log('🔄 Adding metadata column to plans table...\n');

  try {
    // Step 1: Add metadata column using RPC or direct query
    console.log('📦 Step 1: Adding metadata JSONB column...');

    // Since we can't use RPC to alter table, we'll just try to update with metadata
    // If the column doesn't exist, the update will fail and we'll inform the user
    console.log('Checking if metadata column exists by attempting an update...\n');

    const { data: testPlan, error: testError } = await supabase
      .from('plans')
      .select('id, metadata')
      .limit(1)
      .single();

    if (
      testError &&
      testError.message.includes('column') &&
      testError.message.includes('metadata')
    ) {
      console.log('❌ metadata column does NOT exist in plans table!');
      console.log('\n📌 MANUAL ACTION REQUIRED:');
      console.log('Please run this SQL in Supabase Dashboard -> SQL Editor:\n');
      console.log("ALTER TABLE plans ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;");
      console.log('CREATE INDEX IF NOT EXISTS idx_plans_metadata ON plans USING gin(metadata);');
      console.log('\nAfter running the SQL, run this script again to populate metadata.\n');
      process.exit(1);
    }

    console.log('✅ metadata column exists! (or table is empty)');

    // Step 2: Update existing plans with default metadata
    console.log('\n📊 Step 2: Updating existing plans with metadata...');
    await updatePlansWithMetadata();
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

async function updatePlansWithMetadata() {
  // Get all existing plans
  const { data: plans, error: fetchError } = await supabase.from('plans').select('*');

  if (fetchError) {
    console.error('  ❌ Failed to fetch plans:', fetchError.message);
    return;
  }

  console.log(`  Found ${plans.length} plans to update...`);

  // Define metadata for each plan type
  const planMetadata = {
    'Single Session': {
      type: 'single',
      currency: 'AZN',
      description: 'Single gym visit - pay as you go',
      features: ['One-time gym access', 'Access to all equipment', 'Valid for 1 day'],
      limitations: ['No class bookings', 'Single visit only'],
      isActive: true,
      isPopular: false,
      discountPercentage: 0,
    },
    'Monthly Limited': {
      type: 'monthly-limited',
      currency: 'AZN',
      description: '12 visits per month - perfect for regular members',
      features: [
        '12 gym visits per month',
        'Class bookings included',
        'Valid for 30 days',
        'Rollover not available',
      ],
      limitations: ['Maximum 12 visits per month', 'No unused visits rollover'],
      isActive: true,
      isPopular: true,
      discountPercentage: 0,
    },
    'Monthly Unlimited': {
      type: 'monthly-unlimited',
      currency: 'AZN',
      description: 'Unlimited access - best value for dedicated members',
      features: [
        'Unlimited gym access',
        'All classes included',
        'Valid for 30 days',
        'Best value for money',
      ],
      limitations: [],
      isActive: true,
      isPopular: true,
      discountPercentage: 0,
    },
    'Company Basic': {
      type: 'company',
      currency: 'AZN',
      description: 'Corporate membership plan with unlimited access',
      features: [
        'Unlimited gym access',
        'All classes included',
        'Corporate rates',
        'Valid for 30 days',
      ],
      limitations: ['Requires company contract'],
      isActive: true,
      isPopular: false,
      discountPercentage: 10,
    },
  };

  for (const plan of plans) {
    const metadata = planMetadata[plan.name] || {
      type: 'single',
      currency: 'AZN',
      description: plan.name,
      features: [],
      limitations: [],
      isActive: true,
      isPopular: false,
      discountPercentage: 0,
    };

    const { error: updateError } = await supabase
      .from('plans')
      .update({ metadata })
      .eq('id', plan.id);

    if (updateError) {
      console.error(`  ❌ Failed to update "${plan.name}":`, updateError.message);
    } else {
      console.log(`  ✅ Updated metadata for: "${plan.name}"`);
    }
  }

  console.log('\n✅ All plans updated with metadata!');

  // Verify
  console.log('\n📊 Step 3: Verification...');
  const { data: updatedPlans } = await supabase
    .from('plans')
    .select('id, name, metadata')
    .order('id');

  if (updatedPlans) {
    console.log('\n  Plans with metadata:');
    updatedPlans.forEach((plan) => {
      console.log(`    • ${plan.name}: ${plan.metadata?.description || 'NO METADATA'}`);
    });
  }

  console.log('\n✅ Migration completed successfully!');
}

// Run migration
addMetadataColumn();
