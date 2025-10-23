// test-real-email.js
// Test sending to the verified account email

const userService = require('./services/userService');

async function testRealEmail() {
  console.log('🧪 Testing Email to YOUR Email Address\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testEmail = 'vikingshammerxfit@gmail.com'; // Your verified email

  console.log('📋 Creating test member with YOUR email...');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Name: Test User\n`);

  const result = await userService.createUser({
    name: 'Test User',
    email: testEmail,
    phone: '+1234567890',
    role: 'member',
    dob: '1990-01-01',
    membership_type: 'Monthly Unlimited',
  });

  if (result.success) {
    console.log('✅ Member created successfully!');
    console.log(`   User ID: ${result.data.id}`);
    console.log(`   Email: ${result.data.email}\n`);

    console.log('📧 CHECK YOUR EMAIL INBOX!');
    console.log('   📬 vikingshammerxfit@gmail.com\n');
    console.log('   You should receive an invitation email from:');
    console.log('   Viking Hammer CrossFit <onboarding@resend.dev>\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 TEST COMPLETE - Check your Gmail!');
    console.log('═══════════════════════════════════════════════════════════');
  } else {
    console.log('❌ Error:', result.error);
  }
}

testRealEmail();
