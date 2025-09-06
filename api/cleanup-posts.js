// CommonJS version for Vercel - Cleanup Sample Posts
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
      return res.status(500).json({ message: 'Database not configured' });
    }

    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
    }

    // Define schemas
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

    const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

    // Delete all posts (cleanup)
    const deleteResult = await Post.deleteMany({});
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} posts`);

    res.status(200).json({
      message: `Successfully deleted ${deleteResult.deletedCount} posts`,
      deletedCount: deleteResult.deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      message: 'Failed to cleanup posts',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
