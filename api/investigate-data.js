// CommonJS version for Vercel - Detailed Data Investigation
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

    if (!process.env.MONGO_URI) {
      return res.status(500).json({
        message: 'Database not configured',
        timestamp: new Date().toISOString()
      });
    }

    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
    }

    // Get all collections in the database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    // Check each collection for data
    const collectionData = {};
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      collectionData[collectionName] = count;
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

    // Get detailed counts
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();

    // Check if there are any documents in the posts collection (raw)
    const rawPostCount = await db.collection('posts').countDocuments();
    
    // Get sample documents from each collection
    const sampleUsers = await User.find().limit(3).select('username email createdAt');
    const samplePosts = await Post.find().limit(3);
    const rawPosts = await db.collection('posts').find().limit(3).toArray();

    // Check for posts with different field names
    const postsWithContent = await db.collection('posts').find({ content: { $exists: true } }).limit(3).toArray();
    const postsWithText = await db.collection('posts').find({ text: { $exists: true } }).limit(3).toArray();
    const postsWithMessage = await db.collection('posts').find({ message: { $exists: true } }).limit(3).toArray();

    res.status(200).json({
      message: 'Detailed data investigation completed',
      database: {
        status: 'connected',
        collections: collectionData
      },
      counts: {
        users: userCount,
        posts: postCount,
        rawPosts: rawPostCount
      },
      samples: {
        users: sampleUsers,
        posts: samplePosts,
        rawPosts: rawPosts
      },
      alternativePostFields: {
        postsWithContent: postsWithContent.length,
        postsWithText: postsWithText.length,
        postsWithMessage: postsWithMessage.length,
        sampleContentPosts: postsWithContent,
        sampleTextPosts: postsWithText,
        sampleMessagePosts: postsWithMessage
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Detailed investigation error:', error);
    res.status(500).json({
      message: 'Detailed investigation failed',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
