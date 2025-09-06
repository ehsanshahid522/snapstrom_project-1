const express = require('express');

const app = express();

// Handle ALL OPTIONS requests globally
app.options('*', (req, res) => {
  console.log('🌐 CORS PROXY: Handling OPTIONS request for:', req.path);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  
  res.status(200).end();
});

// Handle ALL requests to add CORS headers
app.use('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  
  next();
});

// Health check
app.get('/api/cors-proxy/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CORS proxy is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
