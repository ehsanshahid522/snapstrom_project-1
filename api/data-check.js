import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

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

// Initialize models safely
let User, Post;
try {
  User = mongoose.models.User || mongoose.model('User', UserSchema);
  Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
} catch (error) {
  console.error('❌ Model initialization error:', error);
}

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable not set');
    }
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log('✅ MongoDB connected for data check');
    }
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};

// RADICAL OPTIONS HANDLER
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// DATA CHECK ENDPOINT
app.get('/api/data-check', async (req, res) => {
  console.log('🔍 DATA CHECK request received');
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    // Check environment variables first
    const envCheck = {
      MONGO_URI: !!process.env.MONGO_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    console.log('🔍 Environment check:', envCheck);
    
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ 
        message: 'Database not configured - MONGO_URI missing',
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
    }

    // Try to connect to database
    const connected = await connectDB();
    if (!connected) {
      return res.status(503).json({ 
        message: 'Database connection failed',
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
    }

    // Check database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Try to count documents with error handling
    let userCount = 0;
    let postCount = 0;
    let recentPosts = [];
    let recentUsers = [];
    
    try {
      userCount = await User.countDocuments();
      postCount = await Post.countDocuments();
      
      recentPosts = await Post.find()
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 })
        .limit(10);
      
      recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username email createdAt');
        
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      return res.status(500).json({
        message: 'Database query failed',
        error: dbError.message,
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Found ${userCount} users and ${postCount} posts`);

    res.json({
      message: 'Data check completed successfully',
      environment: envCheck,
      database: {
        status: dbStatus,
        userCount,
        postCount
      },
      recentData: {
        posts: recentPosts.map(post => ({
          id: post._id,
          username: post.username,
          content: post.content ? post.content.substring(0, 100) + '...' : 'No content',
          createdAt: post.createdAt,
          likes: post.likes ? post.likes.length : 0,
          comments: post.comments ? post.comments.length : 0
        })),
        users: recentUsers.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Data check error:', error);
    res.status(500).json({ 
      message: 'Data check failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 DATA CHECK Global error handler:', error);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (!res.headersSent) {
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

export default app;