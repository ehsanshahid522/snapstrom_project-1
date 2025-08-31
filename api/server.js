import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Simple CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Increase payload limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection function
async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGO_URI environment variable is not set');
      return false;
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    
    const options = {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      family: 4,
      retryWrites: true,
      w: 'majority',
      bufferCommands: false,
      bufferMaxEntries: 0
    };

    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoints
app.get('/test/ping', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/test/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/test/db', async (req, res) => {
  try {
    const connected = mongoose.connection.readyState === 1;
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

// Simple auth routes (without database dependency)
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    // Import User model dynamically
    const User = (await import('../backend/server/models/User.js')).default;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration error', error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    // Import User model and jwt dynamically
    const User = (await import('../backend/server/models/User.js')).default;
    const jwt = await import('jsonwebtoken');
    const bcrypt = await import('bcrypt');
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// Simple upload route (without database dependency)
app.post('/upload', async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    // Import multer and File model dynamically
    const multer = await import('multer');
    const File = (await import('../backend/server/models/File.js')).default;
    const User = (await import('../backend/server/models/User.js')).default;
    
    // Configure multer
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
      }
    });
    
    const upload = multer({
      storage: storage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });
    
    // Handle single file upload
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }
      
      const { isPrivate = false, caption = '', tags = '' } = req.body;
      
      // Create file document
      const file = new File({
        filename: req.file.filename,
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        caption: caption.trim(),
        tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0) : [],
        isPrivate: isPrivate === 'true',
        uploader: req.user?.id || 'unknown',
        uploaderUsername: req.user?.username || 'unknown',
        uploadTime: new Date(),
        processed: false
      });
      
      await file.save();
      
      res.json({
        message: 'Upload successful',
        filename: req.file.filename,
        fileId: file._id
      });
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload error', error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Not Found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

// Connect to database on startup
connectDB();

// Export for Vercel
export default app;
