// update-test-members.js
// Update specific test members with proper names

const { supabase } = require('./supabaseClient');

async function updateTestMembers() {
  console.log('🔧 Updating test member names...\n');

  const updates = [
    {
      email: 'agil83p@gmail.com',
      name: 'Vida Alis',
      membership_type: 'Monthly Unlimited',
      phone: '+994 3003323',
    },
    {
      email: 'erik.thorsson.test@vikinghammer.com',
      name: 'Erik Thorsson',
      membership_type: 'Pay-per-Class',
      phone: '+1234567890',
    },
  ];

  for (const update of updates) {
    console.log(`📋 Updating: ${update.email}`);

    const { data, error } = await supabase
      .from('users_profile')
      .update({
        name: update.name,
        membership_type: update.membership_type,
        phone: update.phone,
      })
      .eq('email', update.email)
      .select();

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`   ⚠️  User not found`);
    } else {
      console.log(`   ✅ Updated to: ${update.name}`);
      console.log(`      Membership: ${update.membership_type}`);
      console.log(`      Phone: ${update.phone}`);
    }
    console.log('');
  }

  console.log('🎯 Test member updates complete!');
}

updateTestMembers();
