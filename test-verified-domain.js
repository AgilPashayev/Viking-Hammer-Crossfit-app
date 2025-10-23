// test-verified-domain.js
// Test email with verified domain

const userService = require('./services/userService');

async function testVerifiedDomain() {
  console.log('🧪 Testing Email with Verified Domain\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Domain: sunrisehorizonhome.com ✅');
  console.log('From: noreply@sunrisehorizonhome.com\n');

  const testEmail = 'homecraftwy@gmail.com';

  console.log(`📋 Creating member: ${testEmail}\n`);

  const result = await userService.createUser({
    name: 'HomeCraft User',
    email: testEmail,
    phone: '+994501234567',
    role: 'member',
    dob: '1990-01-01',
    membership_type: 'Monthly Unlimited',
  });

  if (result.success) {
    console.log('✅ Member created successfully!');
    console.log(`   User ID: ${result.data.id}`);
    console.log(`   Name: ${result.data.name}`);
    console.log(`   Email: ${result.data.email}\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📧 EMAIL SENT!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n✉️  Check inbox: ${testEmail}`);
    console.log('   From: Viking Hammer CrossFit <noreply@sunrisehorizonhome.com>');
    console.log('   Subject: Welcome to Viking Hammer CrossFit! 🏋️\n');

    // Get invitation link
    console.log('🔗 To get the invitation link manually:');
    console.log(`   node get-invitation-link.js ${testEmail}\n`);
  } else {
    console.log('❌ Error:', result.error);
  }
}

testVerifiedDomain();
