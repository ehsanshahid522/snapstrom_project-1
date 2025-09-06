const express = require('express');

const app = express();

// ULTIMATE CORS SOLUTION - HANDLE OPTIONS BEFORE ANYTHING ELSE
app.use((req, res, next) => {
  console.log('🚨 CORS TEST: Processing request:', req.method, req.path);
  
  // Set ALL CORS headers immediately
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-JSON');
  
  // Handle OPTIONS requests with immediate response - NO PROCESSING
  if (req.method === 'OPTIONS') {
    console.log('🚨 CORS TEST: Handling OPTIONS request - returning 200 immediately');
    res.status(200).json({ 
      message: 'CORS preflight successful', 
      method: 'OPTIONS',
      timestamp: new Date().toISOString(),
      endpoint: req.path,
      status: 'success'
    });
    return; // CRITICAL: Stop all processing here
  }
  
  next();
});

// OVERRIDE ALL RESPONSE METHODS TO FORCE CORS
app.use((req, res, next) => {
  // Override res.json
  const originalJson = res.json;
  res.json = function(data) {
    this.header('Access-Control-Allow-Origin', '*');
    this.header('Access-Control-Allow-Credentials', 'true');
    this.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    this.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    this.header('Access-Control-Max-Age', '86400');
    return originalJson.call(this, data);
  };
  
  // Override res.status
  const originalStatus = res.status;
  res.status = function(code) {
    this.header('Access-Control-Allow-Origin', '*');
    this.header('Access-Control-Allow-Credentials', 'true');
    this.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    this.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    this.header('Access-Control-Max-Age', '86400');
    return originalStatus.call(this, code);
  };
  
  // Override res.send
  const originalSend = res.send;
  res.send = function(data) {
    this.header('Access-Control-Allow-Origin', '*');
    this.header('Access-Control-Allow-Credentials', 'true');
    this.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    this.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    this.header('Access-Control-Max-Age', '86400');
    return originalSend.call(this, data);
  };
  
  next();
});

// CORS TEST ENDPOINT
app.get('/api/cors-test', (req, res) => {
  console.log('🧪 CORS TEST: GET request received');
  res.status(200).json({
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    method: 'GET',
    headers: req.headers,
    cors: 'working'
  });
});

app.post('/api/cors-test', (req, res) => {
  console.log('🧪 CORS TEST: POST request received');
  res.status(200).json({
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    method: 'POST',
    headers: req.headers,
    cors: 'working'
  });
});

// Handle all other routes
app.use('*', (req, res) => {
  console.log('🧪 CORS TEST: Unhandled route:', req.method, req.path);
  res.status(404).json({
    message: 'Route not found',
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
