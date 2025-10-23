// check-rls-policies.js
// Check current RLS policies on invitations table

const { supabase } = require('./supabaseClient');

async function checkPolicies() {
  console.log('🔍 Checking RLS policies...\n');

  // Try to query information about policies (may not work with anon key)
  const { data, error } = await supabase.rpc('check_policies'); // Custom function if exists

  if (error) {
    console.log('Cannot query policies with anon key (expected)');
  }

  // Test actual insert capability
  console.log('📋 Testing INSERT capability...\n');

  const testInvitation = {
    user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    invitation_token: 'test-token-' + Date.now(),
    email: 'test@example.com',
    phone: '+1234567890',
    delivery_method: 'email',
    invitation_message: 'Test',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    sent_by: 'test',
    status: 'pending',
  };

  const { data: insertData, error: insertError } = await supabase
    .from('invitations')
    .insert([testInvitation])
    .select();

  if (insertError) {
    console.log('❌ INSERT failed:', insertError.message);
    console.log('   Code:', insertError.code);
    console.log('\n🔧 DIAGNOSIS:');

    if (insertError.code === '42501') {
      console.log('   RLS policy is still blocking inserts from anon role');
      console.log('   The policy may not have been created correctly\n');
      console.log('📋 VERIFY in Supabase Dashboard:');
      console.log('   1. Go to: Database → Policies → invitations table');
      console.log('   2. Check if "Backend service can create invitations" exists');
      console.log('   3. Verify it applies to "anon" role for INSERT');
    } else if (insertError.code === '23503') {
      console.log("   Foreign key constraint - user_id doesn't exist (expected)");
      console.log('   ✅ RLS policy is working! (FK error means INSERT was allowed)');
    }
  } else {
    console.log('✅ INSERT successful!');
    console.log('   RLS policy is working correctly');

    // Clean up test data
    await supabase
      .from('invitations')
      .delete()
      .eq('invitation_token', testInvitation.invitation_token);
  }
}

checkPolicies();
