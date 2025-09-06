// CommonJS version for Vercel - Data Check
const mongoose = require('mongoose');

module.exports = async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Check environment variables
    const envCheck = {
      MONGO_URI: !!process.env.MONGO_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    if (!process.env.MONGO_URI) {
      return res.status(500).json({
        message: 'Database not configured - MONGO_URI missing',
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
    }

    // Try to connect to database
    let connected = false;
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
      }
      connected = mongoose.connection.readyState === 1;
    } catch (dbError) {
      console.error('Database connection error:', dbError);
    }

    if (!connected) {
      return res.status(503).json({
        message: 'Database connection failed',
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
    }

    // Define schemas
    const UserSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      profilePicture: { type: String, default: '' },
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      createdAt: { type: Date, default: Date.now }
    });

    const PostSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      username: { type: String, required: true },
      content: { type: String, required: true },
      imageUrl: { type: String, default: '' },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        content: String,
        createdAt: { type: Date, default: Date.now }
      }],
      shares: { type: Number, default: 0 },
      isPrivate: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

    // Count documents
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();

    // Get recent data
    const recentPosts = await Post.find()
      .populate('userId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('username email createdAt');

    res.status(200).json({
      message: 'Data check successful',
      environment: envCheck,
      database: {
        status: 'connected',
        userCount,
        postCount
      },
      recentData: {
        posts: recentPosts.map(post => ({
          id: post._id,
          username: post.username,
          content: post.content ? post.content.substring(0, 50) + '...' : 'No content',
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
    console.error('Data check error:', error);
    res.status(500).json({
      message: 'Data check failed',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
