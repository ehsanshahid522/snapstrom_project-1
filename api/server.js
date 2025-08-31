import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../backend/server/config/database.js';
import authRoutes from '../backend/server/routes/auth.js';
import uploadRoutes from '../backend/server/routes/upload.js';
import feedRoutes from '../backend/server/routes/feed.js';
import shareRoutes from '../backend/server/routes/share.js';
import profileRoutes from '../backend/server/routes/profile.js';
import interactionRoutes from '../backend/server/routes/interactions.js';
import exploreRoutes from '../backend/server/routes/explore.js';
import testRoutes from '../backend/server/routes/test.js';
import errorHandler from '../backend/server/middleware/errorHandler.js';
import logger from '../backend/server/utils/logger.js';
import mongoose from 'mongoose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'https://snapstream.vercel.app',
      'https://snapstream-frontend.vercel.app',
      'https://snapstream-backend.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Increase payload limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/feed', feedRoutes);
app.use('/share', shareRoutes);
app.use('/profile', profileRoutes);
app.use('/interactions', interactionRoutes);
app.use('/explore', exploreRoutes);
app.use('/test', testRoutes);

// 404 handler
app.use((req, res, next) => {
  logger.warn('🚫 404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ 
    message: 'Not Found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Connect to database
connectDB().catch(console.error);

// Export for Vercel
export default app;
