const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// AGGRESSIVE CORS SOLUTION - HANDLE BEFORE EXPRESS MIDDLEWARE
app.use((req, res, next) => {
  console.log('🚨 AGGRESSIVE CORS: Processing request:', req.method, req.path);
  
  // Set ALL CORS headers immediately
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-JSON');
  
  // Handle OPTIONS requests with immediate response - NO PROCESSING
  if (req.method === 'OPTIONS') {
    console.log('🚨 AGGRESSIVE CORS: Handling OPTIONS request - returning 200 immediately');
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

app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectDB();

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Post Schema
const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  image: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Feed endpoint
app.get('/api/feed', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username avatar')
      .populate('likes', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(posts);
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload endpoint
app.post('/api/upload', authenticateToken, async (req, res) => {
  try {
    const { content, image } = req.body;

    const post = new Post({
      content,
      image,
      author: req.user.userId
    });

    await post.save();
    await post.populate('author', 'username avatar');

    res.status(201).json(post);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Profile endpoint
app.get('/api/profile/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await Post.find({ author: user._id })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followers,
        following: user.following
      },
      posts
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like endpoint
app.post('/api/like/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes, isLiked: !isLiked });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow endpoint
app.post('/api/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const user = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!user || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(userId);
    
    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
      user.followers = user.followers.filter(id => id.toString() !== currentUserId);
    } else {
      currentUser.following.push(userId);
      user.followers.push(currentUserId);
    }

    await currentUser.save();
    await user.save();

    res.json({ isFollowing: !isFollowing });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Users search endpoint
app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.userId }
    }).select('username avatar');

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat endpoints
app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  try {
    // Simple implementation - return empty array for now
    res.json([]);
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/chat/conversations', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    
    // Simple implementation - return mock conversation
    res.json({
      id: 'mock-conversation-id',
      participants: [req.user.userId, participantId],
      messages: []
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/chat/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    // Simple implementation - return empty messages
    res.json([]);
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/chat/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    // Simple implementation - return mock message
    res.json({
      id: 'mock-message-id',
      content,
      sender: req.user.userId,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  // Force CORS headers even on errors
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400');
  
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
