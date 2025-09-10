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
  isProfilePicture: {
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

// Simplified database connection function
async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGO_URI environment variable is not set');
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Running in development mode without database');
        return true;
      }
      return false;
    }

    // If already connected, return true
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Database already connected');
      return true;
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Disconnect any existing connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connection with better options for Vercel/serverless
    await mongoose.connect(mongoURI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      retryReads: true,
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000
    });
    
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connected successfully');
      return true;
    } else {
      console.error('❌ MongoDB connection failed - state:', mongoose.connection.readyState);
      return false;
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Try to disconnect and clean up
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('❌ Error disconnecting:', disconnectError.message);
    }
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

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    console.log('🔍 MONGO_URI status:', process.env.MONGO_URI ? 'Set' : 'Not set');
    console.log('🔍 Current connection state:', mongoose.connection.readyState);
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    
    // Test connection
    const connected = await connectDB();
    
    if (connected) {
      // Test a simple query
      const User = mongoose.model('User');
      const userCount = await User.countDocuments();
      
      res.json({
        success: true,
        message: 'Database connection successful',
        userCount: userCount,
        connectionState: mongoose.connection.readyState,
        mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database connection failed',
        connectionState: mongoose.connection.readyState,
        mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test error',
      error: error.message,
      connectionState: mongoose.connection.readyState,
      mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve uploaded images
app.get('/api/images/:fileId', async (req, res) => {
  try {
    // Ensure DB connection with better error handling
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not connected, attempting to connect...');
      try {
        await connectDB();
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (mongoose.connection.readyState !== 1) {
          console.error('❌ Database connection failed after retry');
          return res.status(503).json({ message: 'Database unavailable' });
        }
      } catch (dbError) {
        console.error('❌ Database connection error:', dbError);
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const { fileId } = req.params;
    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
    }

    console.log('🔍 Looking for image:', fileId);
    const file = await File.findById(fileId);
    if (!file) {
      console.error(`❌ Image not found: ${fileId}`);
      return res.status(404).json({ message: 'File not found', fileId });
    }

    console.log('✅ Image found:', file.filename, 'Content-Type:', file.contentType);

    let buffer;
    try {
      if (Buffer.isBuffer(file.fileData)) {
        buffer = file.fileData;
      } else if (typeof file.fileData === 'string') {
        buffer = Buffer.from(file.fileData, 'base64');
      } else {
        console.error('❌ Unsupported file data format for:', fileId);
        return res.status(500).json({ message: 'Unsupported file data format' });
      }

      console.log('📦 Buffer created, size:', buffer.length);
      
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buffer);
    } catch (bufferError) {
      console.error('❌ Buffer processing error:', bufferError);
      return res.status(500).json({ message: 'Error processing image data', error: bufferError.message });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ message: 'Error serving image', error: error.message });
  }
});

// Debug endpoint to check image status
app.get('/api/debug/images/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.json({ 
        exists: false, 
        fileId, 
        message: 'Image not found in database' 
      });
    }
    
    return res.json({
      exists: true,
      fileId,
      filename: file.filename,
      originalName: file.originalName,
      contentType: file.contentType,
      size: file.size,
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt.toISOString(),
      hasFileData: !!file.fileData,
      isProfilePicture: file.isProfilePicture,
      isPrivate: file.isPrivate,
      caption: file.caption
    });
  } catch (error) {
    console.error('Debug image error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migration endpoint to fix existing profile pictures
app.post('/api/migrate/profile-pictures', async (req, res) => {
  try {
    console.log('🔄 Starting profile picture migration...');
    
    // Find all users with profile pictures
    const usersWithProfilePics = await User.find({ 
      profilePicture: { $exists: true, $ne: null } 
    });
    
    console.log(`📊 Found ${usersWithProfilePics.length} users with profile pictures`);
    
    let updatedCount = 0;
    
    for (const user of usersWithProfilePics) {
      // Find the file associated with this user's profile picture
      const profilePicFile = await File.findById(user.profilePicture);
      
      if (profilePicFile) {
        // Update the file to mark it as a profile picture
        await File.findByIdAndUpdate(user.profilePicture, {
          isProfilePicture: true,
          isPrivate: true,
          caption: 'Profile Picture'
        });
        
        updatedCount++;
        console.log(`✅ Updated profile picture for user: ${user.username}`);
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} profile pictures`);
    
    res.json({
      success: true,
      message: `Successfully migrated ${updatedCount} profile pictures`,
      updatedCount,
      totalUsers: usersWithProfilePics.length
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Migration failed', 
      error: error.message 
    });
  }
});

// Get feed posts (For You - all recent posts)
app.get('/api/feed', async (req, res) => {
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
    
    // Get only public posts (exclude private posts and profile pictures)
    const files = await File.find({ 
      $or: [
        { isPrivate: false },
        { isPrivate: { $exists: false } }
      ],
      isProfilePicture: { $ne: true } // Exclude profile pictures
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
        createdAt: file.createdAt.toISOString(),
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
      ],
      isProfilePicture: { $ne: true } // Exclude profile pictures
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
        createdAt: file.createdAt.toISOString(),
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
          ],
          isProfilePicture: { $ne: true } // Exclude profile pictures
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
                createdAt: { $dateToString: { date: '$$comment.createdAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } }
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
    const existingUser = await User.findOne({ 
      $or: [
        { email }, 
        { username: { $regex: `^${username}$`, $options: 'i' } }
      ] 
    });
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

// Admin endpoint to fix usernames with trailing spaces
app.post('/api/admin/fix-usernames', async (req, res) => {
  try {
    console.log('🔧 Starting username cleanup...');
    
    const users = await User.find({});
    let fixedCount = 0;
    const fixedUsernames = [];
    
    for (const user of users) {
      const originalUsername = user.username;
      const trimmedUsername = user.username.trim();
      
      if (originalUsername !== trimmedUsername) {
        console.log(`🔧 Fixing username: "${originalUsername}" -> "${trimmedUsername}"`);
        
        // Check if trimmed username already exists
        const existingUser = await User.findOne({ 
          username: { $regex: `^${trimmedUsername}$`, $options: 'i' },
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          console.log(`⚠️  Skipping "${originalUsername}" - trimmed version "${trimmedUsername}" already exists`);
          continue;
        }
        
        // Update the username
        user.username = trimmedUsername;
        await user.save();
        fixedCount++;
        fixedUsernames.push({ from: originalUsername, to: trimmedUsername });
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} usernames`);
    
    res.json({
      success: true,
      message: `Successfully fixed ${fixedCount} usernames`,
      fixedCount,
      fixedUsernames
    });
    
  } catch (error) {
    console.error('❌ Error fixing usernames:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing usernames',
      error: error.message
    });
  }
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

    // URL decode the username to handle spaces and special characters
    const decodedUsername = decodeURIComponent(username);

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

    console.log('🔍 Looking for user:', decodedUsername);
    const user = await User.findOne({ username: { $regex: `^${decodedUsername}$`, $options: 'i' } }).select('-password');
    if (!user) {
      console.log('❌ User not found:', decodedUsername);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.username);
    console.log('📸 User posts count:', user.posts?.length || 0);

    // Get user's posts (both public and private, but exclude profile pictures)
    const userPosts = await File.find({ 
      uploadedBy: user._id,
      isProfilePicture: { $ne: true } // Exclude profile pictures
    })
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
        createdAt: user.createdAt.toISOString()
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
        uploadTime: post.createdAt.toISOString(),
        createdAt: post.createdAt.toISOString(),
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
      const existingUser = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
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

    // Get user's posts (both public and private for current user, but exclude profile pictures)
    const userPosts = await File.find({ 
      uploadedBy: user._id,
      isProfilePicture: { $ne: true } // Exclude profile pictures
    })
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
        createdAt: user.createdAt.toISOString()
      },
      posts: userPosts.map(post => ({
        id: post._id,
        filename: post.filename,
        caption: post.caption,
        tags: post.tags || [],
        likes: post.likes || [],
        comments: post.comments || [],
        isPrivate: post.isPrivate,
        createdAt: post.createdAt.toISOString(),
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
          filename: 'profile-' + Date.now() + '-' + user.username,
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size,
          caption: 'Profile Picture',
          isPrivate: true, // Make profile pictures private
          isProfilePicture: true, // Mark as profile picture
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
        createdAt: comment.createdAt.toISOString()
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
      createdAt: comment.createdAt.toISOString()
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
      createdAt: post.createdAt.toISOString(),
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

// Chat Database Schemas
const ConversationSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    }
  }],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true })

const Conversation = mongoose.model('Conversation', ConversationSchema)
const Message = mongoose.model('Message', MessageSchema)

// Chat endpoints
app.get('/api/chat/conversations', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const payload = JSON.parse(atob(token.split('.')[1]))
    const userId = payload.userId || payload.id

    // Ensure DB connection with better error handling
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not connected, attempting to connect...');
      try {
        const connected = await connectDB();
        if (!connected) {
          console.error('❌ Database connection failed');
          return res.status(503).json({ message: 'Database unavailable' });
        }
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Double-check connection status
        if (mongoose.connection.readyState !== 1) {
          console.error('❌ Database still not connected after retry');
          return res.status(503).json({ message: 'Database unavailable' });
        }
      } catch (dbError) {
        console.error('❌ Database connection error:', dbError);
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    // Convert userId to ObjectId for proper querying
    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Find conversations where user is a participant
    const conversations = await Conversation.find({
      'participants.user': userObjectId
    })
    .populate('participants.user', 'username profilePicture')
    .sort({ updatedAt: -1 })

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => ({
      id: conv._id,
      participants: conv.participants.map(p => ({
        id: p.user._id,
        username: p.user.username,
        profilePicture: p.user.profilePicture
      })),
      lastMessage: conv.lastMessage ? {
        content: conv.lastMessage.content,
        sender: conv.lastMessage.sender,
        timestamp: conv.lastMessage.timestamp ? conv.lastMessage.timestamp.toISOString() : new Date().toISOString()
      } : null,
      lastMessageAt: (conv.lastMessage?.timestamp || conv.updatedAt).toISOString(),
      createdAt: conv.createdAt.toISOString()
    }))

    res.json({ 
      success: true,
      conversations: formattedConversations 
    })
  } catch (error) {
    console.error('Chat conversations error:', error)
    res.status(500).json({ message: 'Error fetching conversations', error: error.message })
  }
})

app.get('/api/chat/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const payload = JSON.parse(atob(token.split('.')[1]))
    const userId = payload.userId || payload.id

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB()
    }

    // Convert userId to ObjectId for proper comparison
    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Verify user is participant in conversation
    const conversation = await Conversation.findById(conversationId)
    console.log('🔍 Found conversation:', conversation ? 'Yes' : 'No')
    
    if (!conversation) {
      console.log('❌ Conversation not found:', conversationId)
      return res.status(404).json({ message: 'Conversation not found' })
    }
    
    if (!conversation.participants || !conversation.participants.some(p => p.user.toString() === userId.toString())) {
      console.log('❌ User not participant in conversation')
      console.log('Participants:', conversation.participants?.map(p => p.user.toString()))
      return res.status(403).json({ message: 'Access denied to this conversation' })
    }

    // Fetch messages for this conversation
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: 1 })

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      content: msg.content,
      sender: {
        id: msg.sender._id,
        username: msg.sender.username,
        profilePicture: msg.sender.profilePicture
      },
      timestamp: msg.createdAt.toISOString(),
      readBy: msg.readBy
    }))

    res.json({ 
      success: true,
      messages: formattedMessages 
    })
  } catch (error) {
    console.error('Chat messages error:', error)
    res.status(500).json({ message: 'Error fetching messages', error: error.message })
  }
})

app.post('/api/chat/start-conversation', async (req, res) => {
  try {
    console.log('🚀 Start conversation request received');
    console.log('📝 Request body:', req.body);
    
    const { username } = req.body
    if (!username) {
      console.log('❌ No username provided');
      return res.status(400).json({ message: 'Username is required' })
    }

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token provided' })
    }

    console.log('🔑 Token received, parsing...');
    const payload = JSON.parse(atob(token.split('.')[1]))
    const userId = payload.userId || payload.id
    const currentUsername = payload.username

    console.log('👤 User ID:', userId);
    console.log('👤 Current username:', currentUsername);
    console.log('🎯 Target username:', username);

    if (!userId) {
      console.log('❌ No user ID in token');
      return res.status(401).json({ message: 'Invalid token: missing user ID' })
    }

    if (!currentUsername) {
      console.log('❌ No username in token');
      return res.status(401).json({ message: 'Invalid token: missing username' })
    }

    // Ensure DB connection with better error handling
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not connected, attempting to connect...');
      try {
        await connectDB();
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (mongoose.connection.readyState !== 1) {
          console.error('❌ Database connection failed after retry');
          return res.status(503).json({ message: 'Database unavailable' });
        }
      } catch (dbError) {
        console.error('❌ Database connection error:', dbError);
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    // Convert userId to ObjectId for proper querying
    console.log('🔄 Converting user ID to ObjectId...');
    const userObjectId = new mongoose.Types.ObjectId(userId)
    console.log('✅ User ObjectId created:', userObjectId);

    console.log('🔍 Starting conversation between:', currentUsername, 'and', username)

    // Find the target user
    console.log('🔍 Searching for target user:', username);
    const targetUser = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } })
    if (!targetUser) {
      console.log('❌ Target user not found:', username)
      return res.status(404).json({ message: 'User not found' })
    }

    console.log('✅ Target user found:', targetUser.username, 'ID:', targetUser._id)

    // Check if conversation already exists
    console.log('🔍 Checking for existing conversation...');
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [userObjectId, targetUser._id] }
    }).populate('participants.user', 'username profilePicture')

    if (!conversation) {
      console.log('📝 Creating new conversation...')
      try {
        // Create new conversation
        conversation = new Conversation({
          participants: [
            { user: userObjectId, username: currentUsername },
            { user: targetUser._id, username: targetUser.username }
          ]
        })
        console.log('💾 Saving conversation to database...');
        await conversation.save()
        console.log('✅ Conversation saved, populating participants...');
        await conversation.populate('participants.user', 'username profilePicture')
        console.log('✅ New conversation created:', conversation._id)
      } catch (saveError) {
        console.error('❌ Error saving conversation:', saveError);
        throw saveError;
      }
    } else {
      console.log('✅ Existing conversation found:', conversation._id)
    }

    // Format conversation for frontend
    console.log('🔄 Formatting conversation for frontend...');
    const formattedConversation = {
      id: conversation._id,
      participants: conversation.participants.map(p => ({
        id: p.user._id,
        username: p.user.username,
        profilePicture: p.user.profilePicture
      })),
      lastMessage: null,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt.toISOString()
    }

    console.log('✅ Formatted conversation:', formattedConversation);
    console.log('📤 Sending response...');

    res.json({ 
      success: true,
      conversation: formattedConversation 
    })
  } catch (error) {
    console.error('❌ Start conversation error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ 
      message: 'Error starting conversation', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// Send message endpoint
app.post('/api/chat/send-message', async (req, res) => {
  try {
    const { conversationId, content } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const payload = JSON.parse(atob(token.split('.')[1]))
    const userId = payload.userId || payload.id

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB()
    }

    // Convert userId to ObjectId for proper comparison
    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Verify user is participant in conversation
    const conversation = await Conversation.findById(conversationId)
    console.log('🔍 Found conversation:', conversation ? 'Yes' : 'No')
    
    if (!conversation) {
      console.log('❌ Conversation not found:', conversationId)
      return res.status(404).json({ message: 'Conversation not found' })
    }
    
    if (!conversation.participants || !conversation.participants.some(p => p.user.toString() === userId.toString())) {
      console.log('❌ User not participant in conversation')
      console.log('Participants:', conversation.participants?.map(p => p.user.toString()))
      return res.status(403).json({ message: 'Access denied to this conversation' })
    }

    // Create new message
    const message = new Message({
      conversation: conversationId,
      sender: userObjectId,
      content: content.trim()
    })
    await message.save()

    // Update conversation's last message
    conversation.lastMessage = message._id
    conversation.lastMessageAt = new Date()
    await conversation.save()

    // Populate message with sender info
    await message.populate('sender', 'username profilePicture')

    // Format message for frontend
    const formattedMessage = {
      id: message._id,
      content: message.content,
      sender: {
        id: message.sender._id,
        username: message.sender.username,
        profilePicture: message.sender.profilePicture
      },
      timestamp: message.createdAt.toISOString(),
      readBy: message.readBy
    }

    res.json({ 
      success: true,
      message: formattedMessage 
    })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ message: 'Error sending message', error: error.message })
  }
})

// Mark messages as read endpoint
app.post('/api/chat/mark-read/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params
    console.log('📖 Mark read request for conversation:', conversationId)
    
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const payload = JSON.parse(atob(token.split('.')[1]))
    const userId = payload.userId || payload.id
    console.log('👤 User ID for mark read:', userId)

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await connectDB()
    }

    // Convert userId to ObjectId for proper comparison
    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Verify user is participant in conversation
    const conversation = await Conversation.findById(conversationId)
    console.log('🔍 Found conversation:', conversation ? 'Yes' : 'No')
    
    if (!conversation) {
      console.log('❌ Conversation not found:', conversationId)
      return res.status(404).json({ message: 'Conversation not found' })
    }
    
    if (!conversation.participants || !conversation.participants.some(p => p.user.toString() === userId.toString())) {
      console.log('❌ User not participant in conversation')
      console.log('Participants:', conversation.participants?.map(p => p.user.toString()))
      return res.status(403).json({ message: 'Access denied to this conversation' })
    }

    // Update lastReadAt for the user
    await Conversation.findByIdAndUpdate(
      conversationId,
      { 
        $set: { 
          'participants.$[elem].lastReadAt': new Date() 
        } 
      },
      { 
        arrayFilters: [{ 'elem.user': userObjectId }] 
      }
    )

    res.json({ 
      success: true,
      message: 'Messages marked as read' 
    })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ message: 'Error marking messages as read', error: error.message })
  }
})

// Search users (primary endpoint)
app.get('/api/search/users', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    // Ensure DB connection with better error handling
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not connected, attempting to connect...');
      try {
        await connectDB();
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (mongoose.connection.readyState !== 1) {
          console.error('❌ Database connection failed after retry');
          return res.status(503).json({ message: 'Database unavailable' });
        }
      } catch (dbError) {
        console.error('❌ Database connection error:', dbError);
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const searchQuery = q.trim();
    console.log('🔍 Searching for users with query:', searchQuery);
    
    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('username profilePicture bio')
    .limit(10);

    console.log('✅ Found', users.length, 'users matching query');

    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio
      }))
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Search users (alternative endpoint for compatibility)
app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    // Ensure DB connection with better error handling
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not connected, attempting to connect...');
      try {
        await connectDB();
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (mongoose.connection.readyState !== 1) {
          console.error('❌ Database connection failed after retry');
          return res.status(503).json({ message: 'Database unavailable' });
        }
      } catch (dbError) {
        console.error('❌ Database connection error:', dbError);
        return res.status(503).json({ message: 'Database unavailable' });
      }
    }

    const searchQuery = q.trim();
    console.log('🔍 Searching for users with query:', searchQuery);
    
    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('username profilePicture bio')
    .limit(10);

    console.log('✅ Found', users.length, 'users matching query');

    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio
      }))
    });
  } catch (error) {
    console.error('❌ Search error:', error);
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
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 API available at http://localhost:${PORT}`);
  });
}
