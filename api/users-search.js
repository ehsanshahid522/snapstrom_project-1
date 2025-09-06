// CommonJS version for Vercel - User Search Function
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

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

// Ensure models are not re-registered
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI environment variable is not set.');
        throw new Error('Database connection string not configured.');
      }
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected for user search');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Auth middleware
const authenticateToken = (req, res, next) => {
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

// RADICAL OPTIONS HANDLER
app.options('*', (req, res) => {
  console.log('🚨 USER SEARCH OPTIONS handler for:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// SEARCH USERS ENDPOINT
app.get('/api/users/search', authenticateToken, async (req, res) => {
  console.log('🔍 USER SEARCH request:', req.query.q);
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { q } = req.query;
    const currentUserId = req.user.userId;
    
    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }
    
    // Search users by username (case insensitive)
    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' },
      _id: { $ne: currentUserId } // Exclude current user
    })
    .select('username profilePicture followers following createdAt')
    .limit(10);
    
    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        createdAt: user.createdAt
      }))
    });
    
  } catch (error) {
    console.error('🚨 User search error:', error);
    res.status(500).json({ 
      message: 'Failed to search users', 
      error: error.message 
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 USER SEARCH Global error handler:', error);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (!res.headersSent) {
    res.status(500).json({
      message: 'Internal server error from user search',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = app;
