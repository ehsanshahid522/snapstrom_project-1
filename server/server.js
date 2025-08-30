import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import feedRoutes from './routes/feed.js';
import shareRoutes from './routes/share.js';
import profileRoutes from './routes/profile.js';
import interactionRoutes from './routes/interactions.js';
import exploreRoutes from './routes/explore.js';
import errorHandler from './middleware/errorHandler.js';
dotenv.config();
// Check environment variables
console.log('🔧 Environment check:');
console.log('   MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('   PORT:', process.env.PORT || '3000 (default)');
// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-here';
  console.log('⚠️  Using default JWT_SECRET - not recommended for production');
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/explore', exploreRoutes);
// 404 logger
app.use((req, res, next) => {
  console.log('🚫 404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ message: 'Not Found' });
});
// React app handles share routes on the client side now
// Error handling middleware (must be last)
app.use(errorHandler);
// MongoDB Connection
console.log('Attempting to connect to MongoDB...');
console.log('MONGO_URI:', process.env.MONGO_URI || 'mongodb://localhost:27017/photo-feed-app');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/photo-feed-app', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
      console.log(`📁 Uploads directory: ${path.join(__dirname, '../uploads')}`);
      console.log(`🔐 JWT_SECRET available: ${!!process.env.JWT_SECRET}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Make sure MongoDB is running on your system');
    console.log('💡 You can start MongoDB with: mongod');
  });