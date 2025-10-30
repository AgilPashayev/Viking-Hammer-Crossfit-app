/**
 * Simple Migration: Add metadata column to plans table
 * This uses direct Supabase client queries
 */

const { supabaseAdmin } = require('./supabaseClient');

async function addMetadataColumn() {
  console.log('🚀 Adding metadata column to plans table...\n');

  try {
    // Step 1: Check current schema
    console.log('📊 Checking current plans table structure...');
    const { data: existingPlans, error: selectError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Error checking plans table:', selectError.message);
      return false;
    }

    // Check if metadata column exists
    if (existingPlans && existingPlans.length > 0) {
      const samplePlan = existingPlans[0];
      console.log('📋 Sample plan columns:', Object.keys(samplePlan).join(', '));

      if ('metadata' in samplePlan) {
        console.log('✅ metadata column already exists!');
        console.log('   Current metadata:', JSON.stringify(samplePlan.metadata, null, 2));
        return true;
      } else {
        console.log('⚠️  metadata column NOT found in plans table');
        console.log('\n📝 MANUAL MIGRATION REQUIRED:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Create New Query');
        console.log('5. Copy and paste the following SQL:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`
-- Add metadata JSONB column
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient queries
CREATE INDEX IF NOT EXISTS idx_plans_metadata 
ON public.plans USING gin(metadata);

-- Populate default metadata for existing plans
UPDATE public.plans 
SET metadata = jsonb_build_object(
  'type', CASE 
    WHEN name ILIKE '%single%' THEN 'single'
    WHEN name ILIKE '%unlimited%' THEN 'monthly-unlimited'
    WHEN visit_quota IS NOT NULL AND visit_quota > 0 THEN 'monthly-limited'
    WHEN name ILIKE '%company%' OR name ILIKE '%corporate%' THEN 'company'
    ELSE 'single'
  END,
  'currency', 'AZN',
  'description', name,
  'features', '[]'::jsonb,
  'limitations', '[]'::jsonb,
  'isActive', true,
  'isPopular', false,
  'discountPercentage', 0
)
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- Verify
SELECT id, name, metadata FROM public.plans LIMIT 5;
        `);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n6. Click "Run" button');
        console.log('7. Verify the query executed successfully');
        console.log('8. Return here and run this script again to verify\n');
        return false;
      }
    } else {
      console.log('⚠️  No plans found in table (table might be empty)');
      console.log('   Still need to add metadata column - follow manual migration steps above');
      return false;
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

// Run the check/migration
addMetadataColumn()
  .then((success) => {
    if (success) {
      console.log('✅ Migration verification complete!\n');
      console.log('🎉 Plans table has metadata column and is ready to use.\n');
    } else {
      console.log('⚠️  Please complete the manual migration steps above.\n');
      console.log(
        '💡 After running the SQL in Supabase Dashboard, run this script again to verify.\n',
      );
    }
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
