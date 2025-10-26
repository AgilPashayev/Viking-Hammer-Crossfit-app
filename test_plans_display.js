// Quick test to verify plans display properly
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'env', '.env.dev'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY; // Changed from SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('SUPABASE_KEY:', supabaseAnonKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPlansFetch() {
  console.log('🧪 Testing Plans Fetch (simulating frontend)...\n');

  try {
    // Simulate what the frontend does
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching plans:', error.message);
      return;
    }

    if (!plans || plans.length === 0) {
      console.log('⚠️  No plans found in database!');
      return;
    }

    console.log(`✅ Fetched ${plans.length} plans from database\n`);

    // Simulate the generatePlanMetadata function
    plans.forEach((plan, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Plan ${index + 1}: ${plan.name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  💰 Price: ${plan.price_cents / 100} AZN`);
      console.log(`  📅 Duration: ${plan.duration_days} days`);
      console.log(`  🎫 Visits: ${plan.visit_quota || 'Unlimited'}`);

      // Generate metadata (same logic as frontend)
      let type,
        description,
        features = [],
        limitations = [],
        isPopular = false;

      if (plan.name.toLowerCase().includes('single')) {
        type = 'single';
        description = 'Single gym visit - pay as you go';
        features = ['One-time gym access', 'Access to all equipment', 'Valid for 1 day'];
        limitations = ['No class bookings', 'Single visit only'];
      } else if (plan.name.toLowerCase().includes('unlimited')) {
        type = 'monthly-unlimited';
        description = 'Unlimited access - best value for dedicated members';
        features = [
          'Unlimited gym access',
          'All classes included',
          `Valid for ${plan.duration_days} days`,
          'Best value for money',
        ];
        limitations = [];
        isPopular = true;
      } else if (plan.name.toLowerCase().includes('company')) {
        type = 'company';
        description = 'Corporate membership plan with unlimited access';
        features = [
          'Unlimited gym access',
          'All classes included',
          'Corporate rates',
          `Valid for ${plan.duration_days} days`,
        ];
        limitations = ['Requires company contract'];
      } else if (plan.visit_quota && plan.visit_quota > 1) {
        type = 'monthly-limited';
        description = `${plan.visit_quota} visits per month - perfect for regular members`;
        features = [
          `${plan.visit_quota} gym visits per month`,
          'Class bookings included',
          `Valid for ${plan.duration_days} days`,
        ];
        limitations = [`Maximum ${plan.visit_quota} visits per month`, 'No unused visits rollover'];
        isPopular = true;
      }

      console.log(`  📊 Type: ${type}`);
      console.log(`  📝 Description: ${description}`);
      console.log(`  ${isPopular ? '⭐ POPULAR' : '  '}`);
      console.log(`\n  ✅ Features:`);
      features.forEach((f) => console.log(`     • ${f}`));
      if (limitations.length > 0) {
        console.log(`\n  ⚠️  Limitations:`);
        limitations.forEach((l) => console.log(`     • ${l}`));
      }
      console.log();
    });

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('✅ All plans processed successfully!');
    console.log('\n📌 This is what users should see in Membership Manager.');
    console.log('📌 If not showing, user needs to: Ctrl+Shift+R to hard refresh browser');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPlansFetch();
