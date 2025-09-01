import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './server/config/database.js';
import logger from './server/utils/logger.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testConnection() {
  try {
    logger.info('🔍 Testing MongoDB connection...');
    logger.info('📡 URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    
    if (!process.env.MONGO_URI) {
      logger.error('❌ MONGO_URI environment variable is not set');
      logger.error('📁 Current directory:', __dirname);
      logger.error('🔍 Looking for .env file in:', path.join(__dirname, '.env'));
      process.exit(1);
    }
    
    // Test connection
    await connectDB();
    
    // Test basic operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    logger.info('📚 Collections found:', collections.map(c => c.name));
    
    // Test creating a test document
    const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
    const testDoc = new TestModel({ name: 'test-connection' });
    await testDoc.save();
    logger.info('✅ Test document created successfully');
    
    // Clean up
    await TestModel.deleteOne({ name: 'test-connection' });
    logger.info('🧹 Test document cleaned up');
    
    await mongoose.connection.close();
    logger.info('👋 Disconnected from MongoDB');
    
  } catch (error) {
    logger.error('❌ Database connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
