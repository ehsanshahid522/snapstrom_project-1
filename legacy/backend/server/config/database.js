import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let isConnected = false;

const connectDB = async () => {
  try {
    // If already connected, return existing connection
    if (isConnected) {
      logger.info('✅ Using existing MongoDB connection');
      return;
    }

    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    logger.info('🔗 Attempting to connect to MongoDB...');
    logger.info('📡 URI:', mongoURI.substring(0, 50) + '...');

    // Mongoose connection options optimized for Vercel
    const options = {
      maxPoolSize: 5, // Reduced for serverless
      serverSelectionTimeoutMS: 5000, // Faster timeout
      socketTimeoutMS: 30000, // Reduced timeout
      family: 4, // Use IPv4
      retryWrites: true,
      w: 'majority',
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    };

    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    isConnected = true;
    logger.info('✅ MongoDB connected successfully');
    
    // Log connection details
    try {
      const db = mongoose.connection.db;
      const adminDb = db.admin();
      const buildInfo = await adminDb.buildInfo();
      logger.info(`📊 MongoDB Version: ${buildInfo.version}`);
      logger.info(`🔧 Mongoose Version: ${mongoose.version}`);
    } catch (error) {
      logger.warn('⚠️ Could not get MongoDB version info:', error.message);
    }
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    logger.error('🔍 Error details:', error);
    isConnected = false;
    
    // Don't exit in serverless environment, just log the error
    if (process.env.NODE_ENV === 'production') {
      logger.error('Continuing without database connection in production');
    } else {
      process.exit(1);
    }
  }
};

// Function to check connection status
export const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

export default connectDB;
