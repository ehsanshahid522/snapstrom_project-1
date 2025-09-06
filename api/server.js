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

// AGGRESSIVE CORS FIX - Set headers on EVERY request
app.use((req, res, next) => {
  // Set CORS headers for EVERY request
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Basic CORS middleware as backup
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

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
      // For development, return true to allow server to start
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Running in development mode without database');
        return true;
      }
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
      await mongoose.disconnect();
    }

    // Try each connection strategy
    for (let strategyIndex = 0; strategyIndex < connectionStrategies.length; strategyIndex++) {
      const strategy = connectionStrategies[strategyIndex];
      
      try {
        await mongoose.connect(mongoURI, strategy.options);
        
        // Test the connection
        try {
          const admin = mongoose.connection.db.admin();
          await admin.ping();
          return true;
        } catch (pingError) {
          // Continue to next strategy
        }
      } catch (connectError) {
        // If it's a network error, try next strategy
        if (connectError.name === 'MongoNetworkError' || connectError.name === 'MongoTimeoutError') {
          continue;
        }
        
        // If it's an authentication error, stop trying
        if (connectError.name === 'MongoServerSelectionError' && connectError.message.includes('Authentication failed')) {
          return false;
        }
        
        // If it's a server selection error, log more details
        if (connectError.name === 'MongoServerSelectionError') {
          // Continue to next strategy
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    version: process.version,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
});

// Serve uploaded images
app.get('/api/images/:fileId', async (req, res) => {
  try {
    // Ensure DB connection with retry logic
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

// AGGRESSIVE OPTIONS HANDLER FOR FEED
app.options('/api/feed', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// Get feed posts (For You - all recent posts)
app.get('/api/feed', async (req, res) => {
  // AGGRESSIVE CORS HEADERS FOR FEED
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    // Ensure DB connection with retry logic
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
    
    // Get only public posts (exclude private posts)
    const files = await File.find({ 
      $or: [
        { isPrivate: false },
        { isPrivate: { $exists: false } }
      ]
    })
      .populate('uploadedBy', 'username profilePicture bio')
      .populate('likes', 'username')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Try to find any user for fallback
    let fallbackUser = null;
    try {
      fallbackUser = await User.findOne().select('username profilePicture bio');
      console.log('🔍 Found fallback user:', fallbackUser?.username);
    } catch (error) {
      console.log('⚠️ No fallback user found');
    }
    
    const posts = files.map(file => {
      // Try to find a real user for posts with missing uploaders
      let uploader = file.uploadedBy;
      
      if (!uploader && fallbackUser) {
        // Use fallback user for posts with missing uploaders
        console.log(`⚠️ Post ${file._id} has no uploader, using fallback: ${fallbackUser.username}`);
        uploader = fallbackUser;
      }
      
      console.log(`🔍 Post ${file._id} - Uploader: ${uploader?.username}, Profile Picture: ${uploader?.profilePicture}`);
      
      return {
        id: file._id,
        filename: file.filename,
        caption: file.caption,
        tags: file.tags || [],
        uploadedBy: uploader ? {
          id: uploader._id,
          username: uploader.username,
          profilePicture: uploader.profilePicture,
          bio: uploader.bio
        } : {
          id: null,
          username: 'SnapStream User',
          profilePicture: null,
          bio: 'Original uploader not available'
        },
        likes: file.likes || [],
        comments: file.comments || [],
        isPrivate: file.isPrivate,
        createdAt: file.createdAt,
        imageUrl: `/api/images/${file._id}`
      };
    });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error getting feed', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get following feed posts (posts from users you follow)
app.get('/api/feed/following', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection with retry logic
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
    
    // Get current user with following list
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get posts from users that the current user follows
    const followingUserIds = currentUser.following || [];
    
    if (followingUserIds.length === 0) {
      // User is not following anyone, return empty array
      return res.json([]);
    }
    
    const files = await File.find({
      uploadedBy: { $in: followingUserIds },
      $or: [
        { isPrivate: false },
        { isPrivate: { $exists: false } }
      ]
    })
      .populate('uploadedBy', 'username profilePicture bio')
      .populate('likes', 'username')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);
    
    const posts = files.map(file => {
      return {
        id: file._id,
        filename: file.filename,
        caption: file.caption,
        tags: file.tags || [],
        uploadedBy: file.uploadedBy ? {
          id: file.uploadedBy._id,
          username: file.uploadedBy.username,
          profilePicture: file.uploadedBy.profilePicture,
          bio: file.uploadedBy.bio
        } : {
          id: null,
          username: 'Unknown User',
          profilePicture: null,
          bio: 'User not found'
        },
        likes: file.likes || [],
        comments: file.comments || [],
        isPrivate: file.isPrivate,
        createdAt: file.createdAt,
        imageUrl: `/api/images/${file._id}`
      };
    });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error getting following feed', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get trending posts (most liked and commented posts in the last 7 days)
app.get('/api/trending', async (req, res) => {
  try {
    // Ensure DB connection with retry logic
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
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get trending posts using aggregation pipeline
    const trendingPosts = await File.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          $or: [
            { isPrivate: false },
            { isPrivate: { $exists: false } }
          ]
        }
      },
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ['$likes', []] } },
          commentCount: { $size: { $ifNull: ['$comments', []] } },
          engagementScore: {
            $add: [
              { $multiply: [{ $size: { $ifNull: ['$likes', []] } }, 2] },
              { $size: { $ifNull: ['$comments', []] } }
            ]
          }
        }
      },
      {
        $sort: { engagementScore: -1, createdAt: -1 }
      },
      {
        $limit: 20
      },
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploadedBy'
        }
      },
      {
        $unwind: {
          path: '$uploadedBy',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'likes',
          foreignField: '_id',
          as: 'likes'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'comments.user',
          foreignField: '_id',
          as: 'commentsUsers'
        }
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: { $ifNull: ['$comments', []] },
              as: 'comment',
              in: {
                $mergeObjects: [
                  '$$comment',
                  {
                    user: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$commentsUsers',
                            cond: { $eq: ['$$this._id', '$$comment.user'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          id: '$_id',
          filename: 1,
          caption: 1,
          tags: 1,
          uploadedBy: {
            id: '$uploadedBy._id',
            username: '$uploadedBy.username',
            profilePicture: '$uploadedBy.profilePicture',
            bio: '$uploadedBy.bio'
          },
          likes: {
            $map: {
              input: '$likes',
              as: 'like',
              in: {
                id: '$$like._id',
                username: '$$like.username'
              }
            }
          },
          comments: {
            $map: {
              input: '$comments',
              as: 'comment',
              in: {
                id: '$$comment._id',
                text: '$$comment.text',
                user: {
                  id: '$$comment.user._id',
                  username: '$$comment.user.username',
                  profilePicture: '$$comment.user.profilePicture'
                },
                createdAt: '$$comment.createdAt'
              }
            }
          },
          isPrivate: 1,
          createdAt: 1,
          likeCount: 1,
          commentCount: 1,
          engagementScore: 1,
          imageUrl: { $concat: ['/api/images/', { $toString: '$_id' }] }
        }
      }
    ]);
    
    res.json(trendingPosts);
  } catch (error) {
    console.error('❌ Trending posts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch trending posts', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
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

// AGGRESSIVE OPTIONS HANDLER FOR LOGIN
app.options('/api/auth/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

app.post('/api/auth/login', async (req, res) => {
  // AGGRESSIVE CORS HEADERS FOR LOGIN
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
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

// Test endpoint to check server status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// API prefixed upload with memory storage
app.post('/api/upload', async (req, res) => {
  try {
    console.log('📤 Upload request received');
    
    // Check authentication first
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header or invalid format');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    console.log('🎫 Token received:', token.substring(0, 20) + '...');
    
    let decoded;
    
    try {
      // Use a fallback JWT secret if not configured
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️ JWT_SECRET not configured, using fallback');
      }
      decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Token verified, user ID:', decoded.id);
    } catch (err) {
      console.error('❌ Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get the authenticated user
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('❌ User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }
    console.log('✅ User found:', user.username);

    // Check if MONGO_URI is configured
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not configured');
      return res.status(500).json({ 
        message: 'Database not configured. Please set MONGO_URI environment variable in Vercel dashboard.',
        error: 'Missing MONGO_URI'
      });
    }

    // Ensure DB connection with quick retry loop to avoid 504s
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 DB not connected, attempting connection...');
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        console.error('❌ Failed to connect to database');
        return res.status(503).json({ message: 'Database unavailable, try again' });
      }
    }
    console.log('✅ Database connected');

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
        console.error('❌ Multer error:', err);
        return res.status(400).json({ message: err.message });
      }
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ message: 'No image file provided' });
      }
      console.log('✅ File received:', req.file.originalname, 'Size:', req.file.size);

      const { isPrivate = false, caption = '', tags = '' } = req.body;
      console.log('📝 Form data:', { isPrivate, caption: caption.substring(0, 50), tags });

      const fileDoc = new File({
        filename: 'image-' + Date.now(),
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        caption: caption.trim(),
        tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
        isPrivate: isPrivate === 'true',
        uploadedBy: user._id, // Use the authenticated user's ID
        fileData: Buffer.from(req.file.buffer)
      });

      await fileDoc.save();
      console.log('✅ File saved to database');

      console.log('✅ Upload successful:', {
        fileId: fileDoc._id,
        uploadedBy: user._id,
        username: user.username,
        filename: fileDoc.filename
      });

      res.json({
        message: 'Upload successful',
        filename: fileDoc.filename,
        fileId: fileDoc._id,
        size: req.file.size
      });
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Upload error', error: err.message });
  }
});

// Get user profile
app.get('/api/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    console.log('🔍 Looking for user:', username);
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.username);
    console.log('📸 User posts count:', user.posts?.length || 0);

    // Get user's posts (both public and private for now)
    const userPosts = await File.find({ uploadedBy: user._id })
      .populate('likes', 'username')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('📱 Found user posts:', userPosts.length);

    // Get follower and following counts
    const followersCount = user.followers ? user.followers.length : 0;
    const followingCount = user.following ? user.following.length : 0;

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isPrivateAccount: user.isPrivateAccount,
        followers: user.followers || [],
        following: user.following || [],
        followersCount,
        followingCount,
        createdAt: user.createdAt
      },
      posts: userPosts.map(post => ({
        id: post._id,
        filename: post.filename,
        originalName: post.originalName,
        caption: post.caption,
        tags: post.tags || [],
        likes: post.likes || [],
        comments: post.comments || [],
        isPrivate: post.isPrivate,
        uploadTime: post.createdAt,
        createdAt: post.createdAt,
        imageUrl: `/api/images/${post._id}`
      }))
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error loading profile', error: error.message });
  }
});

// Update user profile (authenticated)
app.put('/api/profile', async (req, res) => {
  try {
    const { username, bio, isPrivateAccount } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (isPrivateAccount !== undefined) user.isPrivateAccount = isPrivateAccount;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isPrivateAccount: user.isPrivateAccount
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Get current user profile (authenticated)
app.get('/api/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    console.log('🔍 Looking for current user:', decoded.id);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('❌ Current user not found:', decoded.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Current user found:', user.username);

    // Get user's posts (both public and private for current user)
    const userPosts = await File.find({ uploadedBy: user._id })
      .populate('likes', 'username')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('📱 Found current user posts:', userPosts.length);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isPrivateAccount: user.isPrivateAccount,
        followers: user.followers || [],
        following: user.following || [],
        createdAt: user.createdAt
      },
      posts: userPosts.map(post => ({
        id: post._id,
        filename: post.filename,
        caption: post.caption,
        tags: post.tags || [],
        likes: post.likes || [],
        comments: post.comments || [],
        isPrivate: post.isPrivate,
        createdAt: post.createdAt,
        imageUrl: `/api/images/${post._id}`
      }))
    });
  } catch (error) {
    console.error('Current profile error:', error);
    res.status(500).json({ message: 'Error loading profile', error: error.message });
  }
});

// Upload profile picture
app.post('/api/profile/picture', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Configure multer for profile picture upload
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });

    upload.single('profilePicture')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      try {
        // Create a new file document for the profile picture
        const profilePictureFile = new File({
          filename: 'profile-' + Date.now(),
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size,
          caption: 'Profile Picture',
          isPrivate: false,
          uploadedBy: user._id,
          fileData: Buffer.from(req.file.buffer)
        });

        await profilePictureFile.save();

        // Update user's profile picture
        user.profilePicture = profilePictureFile._id;
        await user.save();

        console.log('✅ Profile picture updated successfully:', user.username);

        res.json({
          message: 'Profile picture updated successfully',
          profilePicture: profilePictureFile._id
        });
      } catch (error) {
        console.error('❌ Profile picture upload error:', error);
        res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
});

// Change password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password changed successfully:', user.username);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// Follow/Unfollow user
app.post('/api/follow/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const currentUser = await User.findById(decoded.id);
    const targetUser = await User.findById(userId);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser._id.toString() === userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const isFollowing = currentUser.following.includes(userId);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
    } else {
      // Follow
      currentUser.following.push(userId);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Error processing follow request', error: error.message });
  }
});

// Like/Unlike post
app.post('/api/like/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const post = await File.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = decoded.id;
    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      isLiked: !isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Error processing like request', error: error.message });
  }
});

// Add comment to post
app.post('/api/comment/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const post = await File.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: decoded.id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate user info for the comment
    const populatedPost = await File.findById(postId).populate('comments.user', 'username profilePicture');

    res.json({
      message: 'Comment added successfully',
      comment: {
        id: comment._id,
        text: comment.text,
        user: {
          id: decoded.id,
          username: decoded.username
        },
        createdAt: comment.createdAt
      },
      commentsCount: post.comments.length
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// Get comments for a post
app.get('/api/comments/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const post = await File.findById(postId).populate('comments.user', 'username profilePicture');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = post.comments.map(comment => ({
      id: comment._id,
      text: comment.text,
      user: {
        id: comment.user._id,
        username: comment.user.username,
        profilePicture: comment.user.profilePicture
      },
      createdAt: comment.createdAt
    }));

    res.json({
      comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// Share post (generate shareable link)
app.post('/api/share/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const post = await File.findById(postId).populate('uploadedBy', 'username');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const shareUrl = `https://snapstrom-project-1.vercel.app/post/${postId}`;
    
    res.json({
      message: 'Share link generated',
      shareUrl,
      post: {
        id: post._id,
        caption: post.caption,
        uploadedBy: post.uploadedBy.username,
        imageUrl: `/api/images/${post._id}`
      }
    });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({ message: 'Error generating share link', error: error.message });
  }
});

// Get single post with full details
app.get('/api/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const post = await File.findById(postId)
      .populate('uploadedBy', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      id: post._id,
      filename: post.filename,
      caption: post.caption,
      tags: post.tags,
      uploadedBy: post.uploadedBy,
      likes: post.likes,
      comments: post.comments,
      createdAt: post.createdAt,
      imageUrl: `/api/images/${post._id}`
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
});

// Delete post (only by owner)
app.delete('/api/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const post = await File.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Debug logging
    console.log('🔍 Delete post debug:', {
      postId,
      postOwner: post.uploadedBy.toString(),
      currentUser: decoded.id,
      postOwnerType: typeof post.uploadedBy,
      currentUserType: typeof decoded.id
    });

    // Check if user is the owner of the post
    if (post.uploadedBy.toString() !== decoded.id) {
      console.log('❌ Authorization failed: User is not the owner of the post');
      
      // Additional check: if the post was created with a random ObjectId (old system),
      // we might need to handle this differently. For now, we'll still deny access
      // but provide more detailed error information.
      
      return res.status(403).json({ 
        message: 'You can only delete your own posts',
        debug: {
          postOwner: post.uploadedBy.toString(),
          currentUser: decoded.id,
          postCreatedAt: post.createdAt,
          note: 'If you believe this is your post, please contact support'
        }
      });
    }

    // Delete the post
    await File.findByIdAndDelete(postId);
    
    console.log('✅ Post deleted successfully:', postId);
    
    res.json({
      message: 'Post deleted successfully',
      postId: postId
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
});

// Get follow status for a user
app.get('/api/auth/follow-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(userId);
    
    res.json({
      isFollowing,
      followersCount: currentUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    console.error('Follow status error:', error);
    res.status(500).json({ message: 'Error checking follow status', error: error.message });
  }
});

// Search users
app.get('/api/search/users', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const searchQuery = q.trim();
    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('username profilePicture bio')
    .limit(10);

    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Admin endpoint to delete all posts (use with caution!)
app.delete('/api/admin/delete-all-posts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      let connected = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const ok = await connectDB();
        if (ok) { connected = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!connected) {
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    // Get the current user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Count posts before deletion
    const totalPosts = await File.countDocuments();
    
    console.log(`🗑️  User ${user.username} is deleting all ${totalPosts} posts`);

    // Delete all posts
    const result = await File.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} posts`);

    res.json({
      message: 'All posts deleted successfully',
      deletedCount: result.deletedCount,
      totalPosts: totalPosts,
      deletedBy: user.username,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete all posts error:', error);
    res.status(500).json({ message: 'Error deleting all posts', error: error.message });
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
  // Don't exit the process, just log the error
  console.log('⚠️ Continuing without database connection');
});

// Export for Vercel
export default app;

// Start server if running directly (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
// Import models
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

// Chat routes (real implementation)
app.get('/api/chat/conversations', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Find conversations where user is a participant
    const conversations = await Conversation.find({
      'participants.user': userId,
      isActive: true
    })
    .populate('participants.user', 'username')
    .populate('lastMessage.sender', 'username')
    .sort({ updatedAt: -1 });

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.user._id.toString() !== userId);
      const unreadCount = conv.participants.find(p => p.user._id.toString() === userId)?.unreadCount || 0;
      
      return {
        id: conv._id,
        participants: conv.participants.map(p => ({
          username: p.user.username,
          isOnline: false // TODO: Implement online status
        })),
        lastMessage: conv.lastMessage?.content || '',
        lastMessageTime: conv.lastMessage?.timestamp || conv.updatedAt,
        unreadCount
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
});

app.get('/api/chat/messages/:conversationId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { conversationId } = req.params;

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get messages for this conversation
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      content: msg.content,
      sender: msg.sender.username,
      timestamp: msg.createdAt,
      type: msg.type,
      status: msg.status
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

app.post('/api/chat/send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { conversationId, content, type = 'text' } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Conversation ID and content are required' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Create new message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
      type,
      status: 'sent'
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = {
      content: content.trim(),
      sender: userId,
      timestamp: new Date()
    };
    await conversation.save();

    // Populate sender info for response
    await message.populate('sender', 'username');

    // Format message for frontend
    const formattedMessage = {
      id: message._id,
      content: message.content,
      sender: message.sender.username,
      timestamp: message.createdAt,
      type: message.type,
      status: message.status
    };

    res.json({ 
      success: true, 
      message: formattedMessage 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

app.post('/api/chat/start-conversation', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Find the target user
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === userId) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { user: userId },
          { user: targetUser._id }
        ]
      },
      isActive: true
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [
          {
            user: userId,
            username: decoded.username,
            joinedAt: new Date(),
            lastReadAt: new Date()
          },
          {
            user: targetUser._id,
            username: targetUser.username,
            joinedAt: new Date(),
            lastReadAt: new Date()
          }
        ],
        isActive: true
      });

      await conversation.save();
    }

    // Populate participants
    await conversation.populate('participants.user', 'username');

    res.json({ 
      conversationId: conversation._id,
      participants: conversation.participants.map(p => ({
        username: p.user.username,
        isOnline: false // TODO: Implement online status
      }))
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ message: 'Error starting conversation', error: error.message });
  }
});

app.patch('/api/chat/mark-read/:conversationId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { conversationId } = req.params;

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Update user's last read timestamp in conversation
    await Conversation.updateOne(
      { 
        _id: conversationId,
        'participants.user': userId 
      },
      { 
        $set: { 
          'participants.$.lastReadAt': new Date() 
        } 
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ message: 'Error marking as read', error: error.message });
  }
});

app.get('/api/chat/online-users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // For now, return empty online users array
    // TODO: Implement real-time online status tracking
    res.json({ onlineUsers: [] });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ message: 'Error fetching online users', error: error.message });
  }
});

// User search endpoint for chat
app.get('/api/users/search', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }

    // Search for users by username
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: decoded.userId }
    }).select('username').limit(10);

    res.json({ users: users.map(user => ({ username: user.username })) });
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Global error handler for CORS and other issues
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Set CORS headers even for errors
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Handle other errors
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}`);
});
}
