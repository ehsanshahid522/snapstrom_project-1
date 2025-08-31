#!/usr/bin/env node

/**
 * Simple Backend Test Script
 * Tests critical endpoints using Node.js built-in modules
 */

import https from 'https';
import http from 'http';

const BASE_URL = 'https://snapstream-backend.vercel.app';

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SnapStream-Test-Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`🔍 Testing ${method} ${endpoint}...`);
    const result = await makeRequest(`${BASE_URL}${endpoint}`, method, body);

    if (result.status >= 200 && result.status < 300) {
      console.log(`✅ ${method} ${endpoint} - SUCCESS`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    } else {
      console.log(`❌ ${method} ${endpoint} - FAILED`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Error:`, result.data);
    }

    return { success: result.status >= 200 && result.status < 300, data: result.data, status: result.status };
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
  console.log('5. Deploy to GitHub using: ./deploy.sh');
}

// Run tests
runTests().catch(console.error);
