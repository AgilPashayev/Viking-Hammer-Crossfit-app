const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'env', '.env.dev'), override: true });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addMetadataColumn() {
  console.log('🔄 Adding metadata column to plans table...\n');

  try {
    // Execute raw SQL to add column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `,
    });

    if (error) {
      // If RPC doesn't exist, try direct approach
      console.log('⚠️  RPC method not available, using Supabase client directly...');

      // Just try to insert a record with metadata to test if column exists
      const testPlan = {
        sku: 'test_metadata_check',
        name: 'Test Plan',
        price_cents: 1000,
        duration_days: 30,
        metadata: { test: true },
      };

      const { error: insertError } = await supabase.from('plans').insert([testPlan]);

      if (insertError) {
        if (insertError.message.includes('metadata')) {
          console.log('❌ Metadata column does not exist. Manual database migration required.');
          console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
          console.log('----------------------------------------');
          console.log(
            "ALTER TABLE plans ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;",
          );
          console.log(
            'CREATE INDEX IF NOT EXISTS idx_plans_metadata ON plans USING gin(metadata);',
          );
          console.log('----------------------------------------\n');
          return false;
        }
      } else {
        // Delete test record
        await supabase.from('plans').delete().eq('sku', 'test_metadata_check');
        console.log('✅ Metadata column exists!');
        return true;
      }
    } else {
      console.log('✅ Metadata column migration executed successfully');
      return true;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

addMetadataColumn().then((success) => {
  if (success) {
    console.log('\n✅ Ready to run main migration');
  } else {
    console.log('\n⚠️  Please add metadata column manually first');
  }
});
