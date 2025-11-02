/**
 * Migration Script: Create Initial Subscriptions
 * Creates subscription records for existing users who have membership_type set
 */

const { supabase } = require('./supabaseClient');

async function createInitialSubscriptions() {
  console.log('🚀 Starting subscription migration...\n');

  try {
    // 1. Get all users with membership types
    const { data: users, error: usersError } = await supabase
      .from('users_profile')
      .select('id, name, email, membership_type')
      .not('membership_type', 'is', null)
      .neq('membership_type', 'None');

    if (usersError) throw usersError;

    console.log(`📊 Found ${users.length} users with membership types\n`);

    // 2. Get all plans
    const { data: plans, error: plansError } = await supabase.from('plans').select('*');

    if (plansError) throw plansError;

    console.log(`📋 Available plans: ${plans.map((p) => p.name).join(', ')}\n`);

    // 3. Create subscriptions for each user
    let created = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if subscription already exists
      const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (existing && existing.length > 0) {
        console.log(`⏭️  Skipped ${user.name} - already has active subscription`);
        skipped++;
        continue;
      }

      // Find matching plan
      const matchingPlan = plans.find((p) => p.name === user.membership_type);

      if (!matchingPlan) {
        console.log(`⚠️  Warning: No plan found for "${user.membership_type}" (${user.name})`);
        skipped++;
        continue;
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + matchingPlan.duration_days);

      // Create subscription
      const subscriptionData = {
        user_id: user.id,
        plan_id: matchingPlan.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        remaining_visits: matchingPlan.visit_quota || 999,
        status: 'active',
        notes: `Initial subscription created on ${new Date().toLocaleDateString()}`,
      };

      const { error: insertError } = await supabase.from('memberships').insert(subscriptionData);

      if (insertError) {
        console.log(`❌ Error creating subscription for ${user.name}:`, insertError.message);
        skipped++;
      } else {
        console.log(`✅ Created subscription for ${user.name} - ${matchingPlan.name}`);
        created++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Created: ${created} subscriptions`);
    console.log(`   ⏭️  Skipped: ${skipped} users`);
    console.log(`   📝 Total: ${users.length} users processed\n`);
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

createInitialSubscriptions();
