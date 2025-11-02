// Test the API response for /api/users/me
const fetch = require('node-fetch');

async function testAPI() {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:4001/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'agil83p@yahoo.com',
        password: 'agil123',
      }),
    });

    const loginResult = await loginResponse.json();
    
    if (!loginResult.success) {
      console.error('Login failed:', loginResult);
      return;
    }

    console.log('✅ Login successful');
    console.log('\n--- User data from /api/auth/signin ---');
    console.log(JSON.stringify(loginResult.data.user, null, 2));

    // Now test /api/users/me
    const token = loginResult.data.token;
    const meResponse = await fetch('http://localhost:4001/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const meResult = await meResponse.json();
    console.log('\n--- User data from /api/users/me ---');
    console.log(JSON.stringify(meResult, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
