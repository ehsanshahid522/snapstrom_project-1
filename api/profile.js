// CommonJS version for Vercel - Profile Function
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

// Ensure models are not re-registered
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI environment variable is not set.');
        throw new Error('Database connection string not configured.');
      }
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected for profile');
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
  console.log('🚨 PROFILE OPTIONS handler for:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// GET PROFILE ENDPOINT
app.get('/api/profile/:username', authenticateToken, async (req, res) => {
  console.log('👤 PROFILE request for:', req.params.username);
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { username } = req.params;
    const currentUserId = req.user.userId;
    
    // Find user by username
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's posts
    const posts = await Post.find({ userId: user._id })
      .populate('userId', 'username profilePicture')
      .sort({ createdAt: -1 });
    
    // Check if current user is following this user
    const isFollowing = user.followers.includes(currentUserId);
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt
      },
      posts: posts.map(post => ({
        id: post._id,
        userId: post.userId._id,
        username: post.username,
        content: post.content,
        imageUrl: post.imageUrl,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        isPrivate: post.isPrivate,
        createdAt: post.createdAt,
        __liked: post.likes.includes(currentUserId),
        __likesCount: post.likes.length
      })),
      isFollowing
    });
    
  } catch (error) {
    console.error('🚨 Profile error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch profile', 
      error: error.message 
    });
  }
});

// FOLLOW/UNFOLLOW ENDPOINT
app.post('/api/follow/:userId', authenticateToken, async (req, res) => {
  console.log('👥 FOLLOW request for:', req.params.userId);
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    
    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }
    
    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);
    
    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isFollowing = userToFollow.followers.includes(currentUserId);
    
    if (isFollowing) {
      // Unfollow
      userToFollow.followers.pull(currentUserId);
      currentUser.following.pull(userId);
    } else {
      // Follow
      userToFollow.followers.push(currentUserId);
      currentUser.following.push(userId);
    }
    
    await userToFollow.save();
    await currentUser.save();
    
    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing,
      followersCount: userToFollow.followers.length
    });
    
  } catch (error) {
    console.error('🚨 Follow error:', error);
    res.status(500).json({ 
      message: 'Failed to follow/unfollow user', 
      error: error.message 
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 PROFILE Global error handler:', error);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (!res.headersSent) {
    res.status(500).json({
      message: 'Internal server error from profile',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = app;
