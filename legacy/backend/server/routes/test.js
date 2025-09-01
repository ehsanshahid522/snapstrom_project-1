import express from 'express';
import logger from '../utils/logger.js';
import { isDBConnected } from '../config/database.js';

const router = express.Router();

// Test endpoint to check if API is working
router.get('/ping', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: isDBConnected() ? 'connected' : 'disconnected'
  });
});

// Test endpoint to check environment variables
router.get('/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check database connection
router.get('/db', async (req, res) => {
  try {
    const connected = isDBConnected();
    res.json({
      connected,
      readyState: connected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      connected: false,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
