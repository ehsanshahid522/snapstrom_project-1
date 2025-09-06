const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// ULTIMATE CORS SOLUTION - HANDLE OPTIONS BEFORE ANYTHING ELSE
app.use((req, res, next) => {
  console.log('🚨 ULTIMATE CORS: Processing request:', req.method, req.path);
  
  // Set ALL CORS headers immediately
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-JSON');
  
  // Handle OPTIONS requests with immediate response - NO PROCESSING
  if (req.method === 'OPTIONS') {
    console.log('🚨 ULTIMATE CORS: Handling OPTIONS request - returning 200 immediately');
    res.status(200).json({ 
      message: 'CORS preflight successful', 
      method: 'OPTIONS',
      timestamp: new Date().toISOString(),
      endpoint: req.path,
      status: 'success'
    });
    return; // CRITICAL: Stop all processing here
  }
  
  next();
});

// OVERRIDE ALL RESPONSE METHODS TO FORCE CORS
app.use((req, res, next) => {
  // Override res.json
  const originalJson = res.json;
  res.json = function(data) {
    this.header('Access-Control-Allow-Origin', '*');
    this.header('Access-Control-Allow-Credentials', 'true');
    this.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    this.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    this.header('Access-Control-Max-Age', '86400');
    return originalJson.call(this, data);
  };
  
  // Override res.status
  const originalStatus = res.status;
  res.status = function(code) {
    this.header('Access-Control-Allow-Origin', '*');
    this.header('Access-Control-Allow-Credentials', 'true');
    this.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    this.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    this.header('Access-Control-Max-Age', '86400');
    return originalStatus.call(this, code);
  };
  
  // Override res.send
  const originalSend = res.send;
  res.send = function(data) {
    this.header('Access-Control-Allow-Origin', '*');
    this.header('Access-Control-Allow-Credentials', 'true');
    this.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    this.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    this.header('Access-Control-Max-Age', '86400');
    return originalSend.call(this, data);
  };
  
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

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected for register');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};

// REGISTER ENDPOINT
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 REGISTER request received');
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { username, email, password } = req.body;
    
    console.log('📝 Registration attempt:', { username, email, hasPassword: !!password });
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not set');
      return res.status(500).json({ message: 'Database not configured' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      } else {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      profilePicture: '',
      followers: [],
      following: []
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful for:', email);
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
        followers: newUser.followers.length,
        following: newUser.following.length
      }
    });

  } catch (error) {
    console.error('🚨 Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// Health check
app.get('/api/auth/register', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({ message: 'Register endpoint is working', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 REGISTER Global error handler:', error);
  
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
