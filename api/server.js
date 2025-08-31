import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Simplified CORS configuration for development and production
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.status(204).end();
});

// Increase payload limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// User Schema definition (inline to avoid import issues)
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  profilePicture: {
    type: String,
    default: null
  },
  isPrivateAccount: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

UserSchema.index({ username: 'text' });
const User = mongoose.model('User', UserSchema);

// File Schema definition (inline to avoid import issues)
const FileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

const File = mongoose.model('File', FileSchema);

// Database connection function with detailed debugging
async function connectDB() {
  try {
    let mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGO_URI environment variable is not set');
      return false;
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📝 MongoDB URI length:', mongoURI.length);
    console.log('🔍 MongoDB URI contains @:', mongoURI.includes('@'));
    console.log('🔍 MongoDB URI contains %40:', mongoURI.includes('%40'));
    console.log('🔍 MongoDB URI starts with mongodb+srv:', mongoURI.startsWith('mongodb+srv://'));
    console.log('🔍 MongoDB URI contains .mongodb.net:', mongoURI.includes('.mongodb.net'));
    
    // Auto-fix URL encoding for @ symbol in password
    if (mongoURI.includes('@') && !mongoURI.includes('%40')) {
      console.log('🔧 Auto-fixing URL encoding for @ symbol in password...');
      mongoURI = mongoURI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, (match, username, password) => {
        const encodedPassword = password.replace(/@/g, '%40');
        return `mongodb+srv://${username}:${encodedPassword}@`;
      });
      console.log('✅ URL encoding fixed');
    }

    // Try multiple connection strategies
    const connectionStrategies = [
      {
        name: 'Standard Connection',
        options: {
          maxPoolSize: 5,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 60000,
          family: 4,
          retryWrites: true,
          w: 'majority',
          bufferCommands: false,
          bufferMaxEntries: 0,
          connectTimeoutMS: 30000,
          heartbeatFrequencyMS: 10000,
          maxIdleTimeMS: 30000,
          minPoolSize: 1,
          maxConnecting: 2,
          compressors: ['zlib'],
          zlibCompressionLevel: 6
        }
      },
      {
        name: 'Simple Connection',
        options: {
          maxPoolSize: 1,
          serverSelectionTimeoutMS: 15000,
          socketTimeoutMS: 30000,
          family: 4,
          retryWrites: false,
          w: 1,
          bufferCommands: false,
          bufferMaxEntries: 0,
          connectTimeoutMS: 15000
        }
      },
      {
        name: 'Minimal Connection',
        options: {
          maxPoolSize: 1,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 20000,
          family: 4,
          retryWrites: false,
          w: 1,
          bufferCommands: false,
          bufferMaxEntries: 0,
          connectTimeoutMS: 10000
        }
      }
    ];

    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 Closing existing connection...');
      await mongoose.disconnect();
    }

    // Try each connection strategy
    for (let strategyIndex = 0; strategyIndex < connectionStrategies.length; strategyIndex++) {
      const strategy = connectionStrategies[strategyIndex];
      console.log(`🔄 Trying ${strategy.name} (attempt ${strategyIndex + 1}/${connectionStrategies.length})...`);
      
      try {
        await mongoose.connect(mongoURI, strategy.options);
        console.log(`✅ ${strategy.name} successful`);
        
        // Test the connection
        try {
          console.log('🔍 Testing connection with ping...');
          const admin = mongoose.connection.db.admin();
          await admin.ping();
          console.log('✅ MongoDB ping successful');
          return true;
        } catch (pingError) {
          console.log(`❌ Ping failed for ${strategy.name}:`, pingError.message);
          // Continue to next strategy
        }
      } catch (connectError) {
        console.log(`❌ ${strategy.name} failed:`, connectError.message);
        console.log(`❌ Error type:`, connectError.name);
        console.log(`❌ Error code:`, connectError.code);
        
        // If it's a network error, try next strategy
        if (connectError.name === 'MongoNetworkError' || connectError.name === 'MongoTimeoutError') {
          continue;
        }
        
        // If it's an authentication error, stop trying
        if (connectError.name === 'MongoServerSelectionError' && connectError.message.includes('Authentication failed')) {
          console.error('❌ Authentication failed - check username and password');
          return false;
        }
      }
    }
    
    console.error('❌ All connection strategies failed');
    return false;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error details:', error);
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
    nodeEnv: process.env.NODE_ENV || 'development',
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT || '3000',
    timestamp: new Date().toISOString()
  });
});

app.get('/test/db', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
      connected: isConnected,
      readyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Also handle /api prefixed routes
app.get('/api/test/ping', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test/env', (req, res) => {
  const mongoURI = process.env.MONGO_URI;
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!mongoURI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT,
    mongoUriLength: mongoURI ? mongoURI.length : 0,
    hasAtSymbol: mongoURI ? mongoURI.includes('@') : false,
    hasPercent40: mongoURI ? mongoURI.includes('%40') : false,
    mongoUriStartsWithSrv: mongoURI ? mongoURI.startsWith('mongodb+srv://') : false,
    mongoUriContainsNet: mongoURI ? mongoURI.includes('.mongodb.net') : false,
    mongoUriHasUsername: mongoURI ? mongoURI.includes('://') && mongoURI.includes('@') : false,
    mongoUriHasDatabase: mongoURI ? mongoURI.includes('/?') || mongoURI.includes('/snapstream') : false,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test/db', async (req, res) => {
  try {
    const connected = mongoose.connection.readyState === 1;
    
    // Try to connect if not connected
    if (!connected) {
      console.log('🔄 Health check: Attempting to connect to database...');
      const connectionResult = await connectDB();
      res.json({
        connected: connectionResult,
        readyState: connectionResult ? 'connected' : 'disconnected',
        connectionAttempted: true,
        timestamp: new Date().toISOString(),
        hasMongoUri: !!process.env.MONGO_URI,
        mongoUriLength: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0,
        mongoUriStartsWithSrv: process.env.MONGO_URI ? process.env.MONGO_URI.startsWith('mongodb+srv://') : false,
        mongoUriContainsNet: process.env.MONGO_URI ? process.env.MONGO_URI.includes('.mongodb.net') : false,
        mongoUriHasAtSymbol: process.env.MONGO_URI ? process.env.MONGO_URI.includes('@') : false,
        mongoUriHasPercent40: process.env.MONGO_URI ? process.env.MONGO_URI.includes('%40') : false,
        environment: process.env.NODE_ENV || 'development'
      });
    } else {
      res.json({
        connected: true,
        readyState: 'connected',
        connectionAttempted: false,
        timestamp: new Date().toISOString(),
        hasMongoUri: !!process.env.MONGO_URI,
        mongoUriLength: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0,
        mongoUriStartsWithSrv: process.env.MONGO_URI ? process.env.MONGO_URI.startsWith('mongodb+srv://') : false,
        mongoUriContainsNet: process.env.MONGO_URI ? process.env.MONGO_URI.includes('.mongodb.net') : false,
        mongoUriHasAtSymbol: process.env.MONGO_URI ? process.env.MONGO_URI.includes('@') : false,
        mongoUriHasPercent40: process.env.MONGO_URI ? process.env.MONGO_URI.includes('%40') : false,
        environment: process.env.NODE_ENV || 'development'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
      connected: false,
      connectionAttempted: true,
      timestamp: new Date().toISOString(),
      hasMongoUri: !!process.env.MONGO_URI,
      mongoUriLength: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0,
      mongoUriStartsWithSrv: process.env.MONGO_URI ? process.env.MONGO_URI.startsWith('mongodb+srv://') : false,
      mongoUriContainsNet: process.env.MONGO_URI ? process.env.MONGO_URI.includes('.mongodb.net') : false,
      mongoUriHasAtSymbol: process.env.MONGO_URI ? process.env.MONGO_URI.includes('@') : false,
      mongoUriHasPercent40: process.env.MONGO_URI ? process.env.MONGO_URI.includes('%40') : false,
      environment: process.env.NODE_ENV || 'development'
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
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
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

// API prefixed auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    console.log('📝 Registration attempt:', { username, email, hasPassword: !!password });
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not set');
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    // Enhanced database connection with multiple attempts
    let dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      console.log('🔄 Database not connected, attempting to connect...');
      
      // Try multiple connection attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 Connection attempt ${attempt}/3...`);
        const connected = await connectDB();
        if (connected) {
          dbConnected = true;
          console.log('✅ Database connection successful');
          break;
        } else {
          console.log(`❌ Connection attempt ${attempt} failed`);
          if (attempt < 3) {
            console.log('⏳ Waiting 2 seconds before next attempt...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (!dbConnected) {
        console.error('❌ All database connection attempts failed');
        return res.status(500).json({ 
          message: 'Database connection failed. Please try again in a few moments.',
          error: 'Database unavailable'
        });
      }
    }
    
    console.log('🔍 Checking for existing user...');
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('👤 Creating new user...');
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    console.log('✅ User registered successfully:', user.username);
    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    console.error('❌ Error stack:', err.stack);
    
    // Provide more specific error messages
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ 
        message: 'Database connection issue. Please try again.',
        error: 'Network timeout'
      });
    } else if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid data provided.',
        error: err.message
      });
    } else {
      return res.status(500).json({ 
        message: 'Registration failed. Please try again.',
        error: err.message
      });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email, hasPassword: !!password });
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not set');
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not connected, attempting to connect...');
      const connected = await connectDB();
      if (!connected) {
        console.error('❌ Failed to connect to database');
        return res.status(500).json({ message: 'Database connection failed' });
      }
    }
    
    console.log('🔍 Finding user...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('🔐 Verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Invalid password for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful:', user.username);
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('❌ Login error:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// Simple upload route (without database dependency)
app.post('/upload', async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
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
        uploadedBy: req.user?.id || 'unknown'
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

// API prefixed upload route
app.post('/api/upload', async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    

    
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
        uploadedBy: req.user?.id || 'unknown'
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
