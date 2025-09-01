import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';

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
  fileData: {
    type: Buffer, // Store raw binary to avoid base64 overhead
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
    console.log('🔍 MongoDB URI first 50 chars:', mongoURI.substring(0, 50) + '...');
    
    // Normalize credentials: safely encode username and password
    const credMatch = mongoURI.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/);
    if (credMatch) {
      const protocol = credMatch[1];
      let username = credMatch[2];
      let password = credMatch[3];
      try { username = decodeURIComponent(username); } catch (e) {}
      try { password = decodeURIComponent(password); } catch (e) {}
      const encodedUser = encodeURIComponent(username);
      const encodedPass = encodeURIComponent(password);
      mongoURI = mongoURI.replace(/^(mongodb(?:\+srv)?:\/\/)[^:]+:[^@]+@/, `${protocol}${encodedUser}:${encodedPass}@`);
      console.log('✅ Credentials encoded');
      console.log('📝 Fixed URI length:', mongoURI.length);
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
         console.log(`❌ Full error:`, connectError);
         
         // If it's a network error, try next strategy
         if (connectError.name === 'MongoNetworkError' || connectError.name === 'MongoTimeoutError') {
           continue;
         }
         
         // If it's an authentication error, stop trying
         if (connectError.name === 'MongoServerSelectionError' && connectError.message.includes('Authentication failed')) {
           console.error('❌ Authentication failed - check username and password');
           return false;
         }
         
         // If it's a server selection error, log more details
         if (connectError.name === 'MongoServerSelectionError') {
           console.error('❌ Server selection failed - possible causes:');
           console.error('   - Network access not configured');
           console.error('   - Cluster is paused or inactive');
           console.error('   - Wrong cluster URL');
           console.error('   - Firewall blocking connection');
           console.error('   - Password contains special characters that need encoding');
           console.error('   - Username or password is incorrect');
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
    console.log('🔍 Database test requested');
    
    const hasMongoUri = !!process.env.MONGO_URI;
    const hasJwtSecret = !!process.env.JWT_SECRET;
    const currentState = mongoose.connection.readyState;
    
    console.log('📊 Current state:', {
      hasMongoUri,
      hasJwtSecret,
      currentState,
      mongoUriLength: hasMongoUri ? process.env.MONGO_URI.length : 0
    });
    
    // Try to connect if not already connected
    let connectionAttempted = false;
    let connectionResult = false;
    
    if (currentState !== 1) {
      console.log('🔄 Attempting to connect to database...');
      connectionAttempted = true;
      connectionResult = await connectDB();
      console.log('📊 Connection result:', connectionResult);
    }
    
    const finalState = mongoose.connection.readyState;
    
    res.json({
      connected: finalState === 1,
      readyState: finalState,
      connectionAttempted,
      connectionResult,
      hasMongoUri,
      hasJwtSecret,
      mongoUriLength: hasMongoUri ? process.env.MONGO_URI.length : 0,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      error: error.message,
      connected: false,
      readyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve uploaded images
app.get('/api/images/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    let buffer;
    if (Buffer.isBuffer(file.fileData)) {
      buffer = file.fileData;
    } else if (typeof file.fileData === 'string') {
      buffer = Buffer.from(file.fileData, 'base64');
    } else {
      return res.status(500).json({ message: 'Unsupported file data format' });
    }

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ message: 'Error serving image', error: error.message });
  }
});

// Get feed posts
app.get('/api/feed', async (req, res) => {
  try {
    const files = await File.find({ isPrivate: false })
      .populate('uploadedBy', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);
    
    const posts = files.map(file => ({
      id: file._id,
      filename: file.filename,
      caption: file.caption,
      tags: file.tags,
      uploadedBy: file.uploadedBy,
      likes: file.likes,
      comments: file.comments,
      createdAt: file.createdAt,
      imageUrl: `/api/images/${file._id}`
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({ message: 'Error getting feed', error: error.message });
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
    
    // Ensure database connection with retry logic
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not connected, attempting to connect...');
      let connected = false;
      
      // Try up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 Connection attempt ${attempt}/3...`);
        connected = await connectDB();
        if (connected) {
          console.log('✅ Database connected successfully');
          break;
        } else {
          console.log(`❌ Connection attempt ${attempt} failed`);
          if (attempt < 3) {
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!connected) {
        console.error('❌ All connection attempts failed');
        return res.status(500).json({ 
          message: 'Database connection failed',
          error: 'Unable to establish database connection after multiple attempts'
        });
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

    // Ensure DB connection with quick retry loop to avoid 504s
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable, try again' });
      }
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
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });

    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const { isPrivate = false, caption = '', tags = '' } = req.body;

      const fileDoc = new File({
        filename: req.file.filename,
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        caption: caption.trim(),
        tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
        isPrivate: isPrivate === 'true',
        uploadedBy: req.user?.id || new mongoose.Types.ObjectId(),
        fileData: Buffer.from(await fs.promises.readFile(req.file.path))
      });

      await fileDoc.save();

      res.json({
        message: 'Upload successful',
        filename: req.file.filename,
        fileId: fileDoc._id
      });
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload error', error: err.message });
  }
});

// API prefixed upload with memory storage
app.post('/api/upload', async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    // Ensure DB connection with quick retry loop to avoid 504s
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable, try again' });
      }
    }

    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });

    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const { isPrivate = false, caption = '', tags = '' } = req.body;

      const fileDoc = new File({
        filename: 'image-' + Date.now(),
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        caption: caption.trim(),
        tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
        isPrivate: isPrivate === 'true',
        uploadedBy: req.user?.id || new mongoose.Types.ObjectId(),
        fileData: Buffer.from(req.file.buffer)
      });

      await fileDoc.save();

      res.json({
        message: 'Upload successful',
        filename: fileDoc.filename,
        fileId: fileDoc._id,
        size: req.file.size
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

// Connect to database on startup (but don't block serverless function)
connectDB().then(success => {
  if (success) {
    console.log('✅ Database connected on startup');
  } else {
    console.log('⚠️ Database connection failed on startup - will retry on first request');
  }
}).catch(error => {
  console.error('❌ Database connection error on startup:', error.message);
});

// Export for Vercel
export default app;
