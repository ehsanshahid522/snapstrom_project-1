// Test script to verify database connection
import fetch from 'node-fetch';

const BASE_URL = 'https://snapstrom-project-1.vercel.app';

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

async function runDatabaseTests() {
  console.log('🧪 Running Database Connection Tests...\n');
  
  // Test 1: Health Check
  await testEndpoint('/health');
  
  // Test 2: Environment Variables
  await testEndpoint('/api/test/env');
  
  // Test 3: Database Connection
  await testEndpoint('/api/test/db');
  
  // Test 4: API Ping
  await testEndpoint('/api/test/ping');
  
  console.log('🎉 Database tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. If any test fails, check your environment variables in Vercel');
  console.log('2. Make sure MONGO_URI is set correctly');
  console.log('3. Redeploy your app after setting environment variables');
}

runDatabaseTests().catch(console.error);
