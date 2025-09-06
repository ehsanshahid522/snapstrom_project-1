// CommonJS version for Vercel - Like Function
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
      console.log('✅ MongoDB connected for like');
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
  console.log('🚨 LIKE OPTIONS handler for:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// LIKE/UNLIKE POST ENDPOINT
app.post('/api/like/:postId', authenticateToken, async (req, res) => {
  console.log('❤️ LIKE request for post:', req.params.postId);
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { postId } = req.params;
    const currentUserId = req.user.userId;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const isLiked = post.likes.includes(currentUserId);
    
    if (isLiked) {
      // Unlike
      post.likes.pull(currentUserId);
    } else {
      // Like
      post.likes.push(currentUserId);
    }
    
    await post.save();
    
    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      isLiked: !isLiked,
      likesCount: post.likes.length
    });
    
  } catch (error) {
    console.error('🚨 Like error:', error);
    res.status(500).json({ 
      message: 'Failed to like/unlike post', 
      error: error.message 
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 LIKE Global error handler:', error);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (!res.headersSent) {
    res.status(500).json({
      message: 'Internal server error from like',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = app;
