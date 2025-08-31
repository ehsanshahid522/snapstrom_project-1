// Test script to verify backend functionality
import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_URL || 'https://snapstream.vercel.app';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Testing ${method} ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ ${method} ${endpoint}: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('---');
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: Error`);
    console.log('Error:', error.message);
    console.log('---');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Running Backend Tests...\n');
  
  // Test 1: Health Check
  await testEndpoint('/health');
  
  // Test 2: API Ping
  await testEndpoint('/api/test/ping');
  
  // Test 3: Environment Variables
  await testEndpoint('/api/test/env');
  
  // Test 4: Database Connection
  await testEndpoint('/api/test/db');
  
  // Test 5: Registration
  const testUser = {
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123'
  };
  
  await testEndpoint('/api/auth/register', 'POST', testUser);
  
  // Test 6: Login
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const loginResult = await testEndpoint('/api/auth/login', 'POST', loginData);
  
  console.log('🎉 All tests completed!');
}

runTests().catch(console.error);
