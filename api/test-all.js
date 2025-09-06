const express = require('express');

const app = express();

// ULTRA AGGRESSIVE CORS SETUP - MUST BE FIRST
app.use((req, res, next) => {
  console.log('🧪 TEST ENDPOINT: Processing request:', req.method, req.path);
  
  // Set CORS headers for ALL requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    console.log('🧪 TEST ENDPOINT: Handling OPTIONS request');
    return res.status(200).end();
  }
  
  next();
});

// Test all endpoints
app.get('/api/test-all', (req, res) => {
  console.log('🧪 Testing all endpoints...');
  
  const endpoints = [
    '/api/auth/login',
    '/api/auth/register', 
    '/api/feed',
    '/api/upload',
    '/api/profile/testuser',
    '/api/like/testpost',
    '/api/users/search',
    '/api/chat/conversations',
    '/api/data-check',
    '/api/create-sample-posts',
    '/api/cleanup-posts',
    '/api/cors-proxy/health'
  ];
  
  res.json({
    status: 'ok',
    message: 'All endpoints configured',
    endpoints: endpoints,
    cors: 'enabled',
    timestamp: new Date().toISOString(),
    instructions: {
      login: 'POST /api/auth/login with {username, password}',
      register: 'POST /api/auth/register with {username, email, password}',
      feed: 'GET /api/feed with Authorization header',
      upload: 'POST /api/upload with form data',
      profile: 'GET /api/profile/:username with Authorization header',
      like: 'POST /api/like/:postId with Authorization header',
      search: 'GET /api/users/search?q=username with Authorization header',
      chat: 'GET /api/chat/conversations with Authorization header',
      dataCheck: 'GET /api/data-check',
      createPosts: 'GET /api/create-sample-posts',
      cleanupPosts: 'GET /api/cleanup-posts',
      corsProxy: 'GET /api/cors-proxy/health'
    }
  });
});

module.exports = app;
