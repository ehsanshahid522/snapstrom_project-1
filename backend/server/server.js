import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import feedRoutes from './routes/feed.js';
import shareRoutes from './routes/share.js';
import profileRoutes from './routes/profile.js';
import interactionRoutes from './routes/interactions.js';
import exploreRoutes from './routes/explore.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

dotenv.config();

// Environment validation
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://snapstream-frontend.vercel.app', 'https://snapstream.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: 'connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/explore', exploreRoutes);

// 404 handler
app.use((req, res, next) => {
  logger.warn('🚫 404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ message: 'Not Found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📁 Uploads directory: ${path.join(__dirname, '../uploads')}`);
    });
  } catch (error) {
    logger.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();