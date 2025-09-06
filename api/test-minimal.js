export default function handler(req, res) {
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

  try {
    // Simple response
    res.status(200).json({
      message: 'Minimal test successful',
      method: req.method,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        VERCEL: !!process.env.VERCEL
      }
    });
  } catch (error) {
    console.error('Error in minimal test:', error);
    res.status(500).json({
      message: 'Minimal test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
