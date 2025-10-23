// test-email-delivery.js
// Test Resend email integration

const userService = require('./services/userService');

async function testEmailDelivery() {
  console.log('🧪 Testing Email Delivery with Resend\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create a test member
  const testEmail = `test-email-${Date.now()}@example.com`;

  console.log('📋 Creating test member...');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Name: Email Test Member\n`);

  const result = await userService.createUser({
    name: 'Email Test Member',
    email: testEmail,
    phone: '+1234567890',
    role: 'member',
    dob: '1990-01-01',
    membership_type: 'Monthly Unlimited',
  });

  if (result.success) {
    console.log('✅ Member created successfully!');
    console.log(`   User ID: ${result.data.id}`);
    console.log(`   Name: ${result.data.name}`);
    console.log(`   Email: ${result.data.email}\n`);

    console.log('📧 Check the backend server logs for email delivery status...\n');
    console.log('Expected output:');
    console.log('  ✅ Email sent successfully to ' + testEmail);
    console.log('  ✅ Invitation created and email sent to ' + testEmail);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n💡 To retrieve the invitation link:');
    console.log(`   node get-invitation-link.js ${testEmail}`);
  } else {
    console.log('❌ Member creation failed:', result.error);
  }
}

testEmailDelivery();
