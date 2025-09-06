// CommonJS version for Vercel
module.exports = async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Simple response
    res.status(200).json({
      message: 'CommonJS test successful',
      method: req.method,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('Error in CommonJS test:', error);
    res.status(500).json({
      message: 'CommonJS test failed',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
