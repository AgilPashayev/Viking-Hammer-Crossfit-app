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

async function runMigration() {
  console.log('🔄 Running Membership System Fix Migration...\n');

  try {
    // Step 1: Insert default plans (WITHOUT metadata - use simple structure)
    console.log('📦 Step 1: Creating default membership plans...');
    const plans = [
      {
        sku: 'plan_single_session',
        name: 'Single Session',
        price_cents: 1500,
        duration_days: 1,
        visit_quota: 1,
      },
      {
        sku: 'plan_monthly_limited',
        name: 'Monthly Limited',
        price_cents: 8000,
        duration_days: 30,
        visit_quota: 12,
      },
      {
        sku: 'plan_monthly_unlimited',
        name: 'Monthly Unlimited',
        price_cents: 12000,
        duration_days: 30,
        visit_quota: null,
      },
      {
        sku: 'plan_company_basic',
        name: 'Company Basic',
        price_cents: 8000,
        duration_days: 30,
        visit_quota: null,
      },
    ];

    for (const plan of plans) {
      // Check if plan already exists
      const { data: existing } = await supabase
        .from('plans')
        .select('id')
        .eq('sku', plan.sku)
        .single();

      if (existing) {
        console.log(`  ⏭️  Plan "${plan.name}" already exists, skipping...`);
      } else {
        const { error } = await supabase.from('plans').insert([plan]);

        if (error) {
          console.error(`  ❌ Failed to create "${plan.name}":`, error.message);
        } else {
          console.log(`  ✅ Created plan: "${plan.name}"`);
        }
      }
    }

    // Step 2: Fix invalid membership types
    console.log('\n🔧 Step 2: Fixing invalid membership types...');

    // Get all users with invalid types
    const { data: users, error: usersError } = await supabase
      .from('users_profile')
      .select('id, name, membership_type')
      .eq('role', 'member');

    if (usersError) {
      console.error('  ❌ Failed to fetch users:', usersError.message);
    } else {
      const validTypes = [
        'Single Session',
        'Monthly Limited',
        'Monthly Unlimited',
        'Company Basic',
        'Staff',
      ];
      let fixed = 0;

      for (const user of users) {
        if (user.membership_type && !validTypes.includes(user.membership_type)) {
          let newType = 'Monthly Unlimited';

          // Map old types to new types
          if (user.membership_type.includes('Basic')) {
            newType = 'Monthly Limited';
          } else if (
            user.membership_type.includes('Warrior') ||
            user.membership_type.includes('Pro')
          ) {
            newType = 'Monthly Unlimited';
          }

          const { error: updateError } = await supabase
            .from('users_profile')
            .update({ membership_type: newType })
            .eq('id', user.id);

          if (updateError) {
            console.error(`  ❌ Failed to update ${user.name}:`, updateError.message);
          } else {
            console.log(
              `  ✅ Updated ${user.name || user.id}: "${user.membership_type}" → "${newType}"`,
            );
            fixed++;
          }
        }
      }

      if (fixed === 0) {
        console.log('  ✅ All membership types are valid');
      } else {
        console.log(`  ✅ Fixed ${fixed} invalid membership type(s)`);
      }
    }

    // Step 3: Verify results
    console.log('\n📊 Step 3: Verification...');

    const { data: allPlans } = await supabase
      .from('plans')
      .select('id, name, price_cents, duration_days, visit_quota')
      .order('price_cents', { ascending: true });

    console.log('\n  Available Membership Plans:');
    allPlans.forEach((p) => {
      const price = (p.price_cents / 100).toFixed(2);
      const visits = p.visit_quota ? `${p.visit_quota} visits` : 'Unlimited';
      console.log(`    • ${p.name}: ${price} AZN | ${p.duration_days} days | ${visits}`);
    });

    const { data: membershipTypes } = await supabase
      .from('users_profile')
      .select('membership_type')
      .eq('role', 'member')
      .not('membership_type', 'is', null);

    const uniqueTypes = [...new Set(membershipTypes.map((m) => m.membership_type))];
    console.log('\n  Member Membership Types in Use:');
    uniqueTypes.forEach((type) => {
      const count = membershipTypes.filter((m) => m.membership_type === type).length;
      console.log(`    • ${type}: ${count} member(s)`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
