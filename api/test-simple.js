import express from 'express';

const app = express();

// Basic middleware
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Simple test endpoint
app.get('/api/test-simple', (req, res) => {
  try {
    res.json({
      message: 'Simple Express test successful',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        VERCEL: !!process.env.VERCEL
      }
    });
  } catch (error) {
    console.error('Error in simple test:', error);
    res.status(500).json({
      message: 'Simple test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    message: 'Global error handler',
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

export default app;
