#!/usr/bin/env node

/**
 * Backend Test Script
 * Tests all critical endpoints to ensure the backend is working
 */

const BASE_URL = 'https://snapstream-backend.vercel.app';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`🔍 Testing ${method} ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${method} ${endpoint} - SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ ${method} ${endpoint} - FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error:`, data);
    }

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - ERROR`);
    console.log(`   Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Backend Tests...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check');
  await testEndpoint('/health');
  console.log('');

  // Test 2: API Ping
  console.log('2️⃣ Testing API Ping');
  await testEndpoint('/api/test/ping');
  console.log('');

  // Test 3: Environment Variables
  console.log('3️⃣ Testing Environment Variables');
  await testEndpoint('/api/test/env');
  console.log('');

  // Test 4: Database Connection
  console.log('4️⃣ Testing Database Connection');
  await testEndpoint('/api/test/db');
  console.log('');

  // Test 5: Registration (should fail without proper data)
  console.log('5️⃣ Testing Registration (expected to fail)');
  await testEndpoint('/api/auth/register', 'POST', {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });
  console.log('');

  // Test 6: Login (should fail without proper data)
  console.log('6️⃣ Testing Login (expected to fail)');
  await testEndpoint('/api/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123'
  });
  console.log('');

  console.log('🎉 Backend Tests Completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check the results above');
  console.log('2. If health check fails, check Vercel deployment');
  console.log('3. If database fails, check MONGO_URI environment variable');
  console.log('4. If auth fails, create a test user first');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testEndpoint, runTests };
