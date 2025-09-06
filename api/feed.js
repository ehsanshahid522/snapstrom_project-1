const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// ULTRA AGGRESSIVE CORS SETUP - MUST BE FIRST
app.use((req, res, next) => {
  console.log('🚨 ULTRA CORS: Processing request:', req.method, req.path);
  
  // Set CORS headers for ALL requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    console.log('🚨 ULTRA CORS: Handling OPTIONS request');
    return res.status(200).end();
  }
  
  next();
});

// RADICAL CORS SETUP
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// FORCE CORS HEADERS ON ALL REQUESTS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  next();
});

// User Schema
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true
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
    default: '' 
  },
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  following: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Post Schema
const PostSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  imageUrl: { 
    type: String, 
    default: '' 
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  comments: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    username: String,
    content: String,
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  shares: { 
    type: Number, 
    default: 0 
  },
  isPrivate: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected for feed');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  // Skip authentication for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// SPECIFIC OPTIONS HANDLER FOR FEED
app.options('/api/feed', (req, res) => {
  console.log('🚨 FEED OPTIONS handler for:', req.path);
  console.log('🚨 FEED OPTIONS headers:', req.headers);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// SPECIFIC OPTIONS HANDLER FOR FEED HEALTH
app.options('/api/feed/health', (req, res) => {
  console.log('🚨 FEED HEALTH OPTIONS handler for:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// RADICAL OPTIONS HANDLER FOR ALL OTHER ROUTES
app.options('*', (req, res) => {
  console.log('🚨 GENERAL OPTIONS handler for:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// HEALTH CHECK ENDPOINT (no auth required)
app.get('/api/feed/health', (req, res) => {
  console.log('🏥 FEED HEALTH CHECK');
  res.json({
    status: 'ok',
    message: 'Feed endpoint is working',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// FEED ENDPOINT
app.get('/api/feed', authenticateToken, async (req, res) => {
  console.log('📱 FEED request received');
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    console.log('📱 Fetching feed for user:', req.user.userId);
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not set');
      return res.status(500).json({ message: 'Database not configured' });
    }

    // Get all public posts, sorted by creation date (newest first)
    const posts = await Post.find({ isPrivate: false })
      .populate('userId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`📱 Found ${posts.length} posts for feed`);

    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      id: post._id,
      userId: post.userId._id,
      username: post.username,
      content: post.content,
      imageUrl: post.imageUrl,
      likes: post.likes.length,
      comments: post.comments.length,
      shares: post.shares,
      isPrivate: post.isPrivate,
      createdAt: post.createdAt,
      userProfilePicture: post.userId?.profilePicture || '',
      isLiked: post.likes.includes(req.user.userId),
      commentsList: post.comments.map(comment => ({
        id: comment._id,
        userId: comment.userId,
        username: comment.username,
        content: comment.content,
        createdAt: comment.createdAt
      }))
    }));

    res.json(formattedPosts);

  } catch (error) {
    console.error('🚨 Feed error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch feed', 
      error: error.message 
    });
  }
});

// Health check
app.get('/api/feed', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({ message: 'Feed endpoint is working', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 FEED Global error handler:', error);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (!res.headersSent) {
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

module.exports = app;
