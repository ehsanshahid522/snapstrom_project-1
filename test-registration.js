// Test registration endpoint
import fetch from 'node-fetch';

const BASE_URL = 'https://snapstrom-project-1.vercel.app';

async function testRegistration() {
  try {
    console.log('🧪 Testing Registration Endpoint...\n');
    
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Registration test successful!');
    } else {
      console.log('❌ Registration test failed!');
      console.log('This confirms the database connection issue.');
    }
    
  } catch (error) {
    console.log('❌ Registration test error:', error.message);
  }
}

testRegistration();
