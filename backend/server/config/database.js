import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    logger.info('🔗 Attempting to connect to MongoDB...');
    logger.info('📡 URI:', mongoURI.substring(0, 50) + '...');

    // Mongoose connection options (updated for newer versions)
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority'
    };

    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    logger.info('✅ MongoDB connected successfully');
    
    // Log connection details
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    const buildInfo = await adminDb.buildInfo();
    logger.info(`📊 MongoDB Version: ${buildInfo.version}`);
    logger.info(`🔧 Mongoose Version: ${mongoose.version}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
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
    process.exit(1);
  }
};

export default connectDB;
