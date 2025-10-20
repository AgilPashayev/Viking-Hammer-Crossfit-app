/**
 * Test Announcement Creation
 * Creates a test announcement to verify the complete flow
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'http://localhost:4001';

// Test announcement data
const testAnnouncement = {
  title: '🎉 Welcome to Viking Hammer CrossFit!',
  content:
    'This is a test announcement. You should see this in your Member Dashboard and as a popup notification! Click "Enable Push Notifications" to receive future updates on your device.',
  targetAudience: 'members',
  priority: 'high',
  createdBy: '00000000-0000-0000-0000-000000000001', // Dummy UUID for testing
  status: 'published',
  published_at: new Date().toISOString(),
};

console.log('🧪 Testing Announcement Creation...\n');
console.log('📝 Test Data:');
console.log(JSON.stringify(testAnnouncement, null, 2));
console.log('\n');

// Create announcement
const postData = JSON.stringify(testAnnouncement);

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/api/announcements',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('🚀 Sending POST request to /api/announcements...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode}`);
    console.log('📄 Response Body:');

    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));

      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Announcement created successfully!');
        console.log('\n📋 Next Steps:');
        console.log('  1. Login to frontend as a member');
        console.log('  2. Check if announcement appears in Member Dashboard');
        console.log('  3. Verify popup modal shows with the announcement');
        console.log('  4. Click "Enable Push Notifications" button');
        console.log('  5. Test notification should appear');
        console.log('\n🌐 Frontend URL: http://localhost:5173');
      } else {
        console.log('\n❌ ERROR: Failed to create announcement');
        console.log('Check the error message above for details');
      }
    } catch (e) {
      console.log(data);
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Announcement created!');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.error('\n💡 Make sure backend server is running:');
  console.error('   cd C:\\Users\\AgiL\\viking-hammer-crossfit-app');
  console.error('   node backend-server.js');
});

req.write(postData);
req.end();
