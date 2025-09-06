// CommonJS version for Vercel - Create Sample Posts
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

    // Get existing users
    const users = await User.find().limit(5);
    
    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'No users found. Please register some users first.' 
      });
    }

    // Sample posts data
    const samplePosts = [
      {
        content: "Welcome to Snapstrom! 🎉 This is our first post. Share your moments with the world!",
        username: users[0].username,
        userId: users[0]._id,
        likes: [users[1]?._id, users[2]?._id].filter(Boolean),
        comments: [
          {
            userId: users[1]?._id,
            username: users[1]?.username,
            content: "Great platform! Looking forward to sharing more content.",
            createdAt: new Date()
          }
        ].filter(c => c.userId),
        shares: 3
      },
      {
        content: "Just had an amazing day at the beach! The sunset was absolutely breathtaking. 🌅",
        username: users[1]?.username || users[0].username,
        userId: users[1]?._id || users[0]._id,
        likes: [users[0]?._id, users[2]?._id].filter(Boolean),
        comments: [
          {
            userId: users[0]?._id,
            username: users[0]?.username,
            content: "Beautiful! I love beach sunsets too!",
            createdAt: new Date()
          }
        ].filter(c => c.userId),
        shares: 1
      },
      {
        content: "Working on some exciting new features for Snapstrom! Stay tuned for updates. 💻",
        username: users[2]?.username || users[0].username,
        userId: users[2]?._id || users[0]._id,
        likes: [users[0]?._id, users[1]?._id].filter(Boolean),
        comments: [],
        shares: 5
      },
      {
        content: "Coffee and coding - the perfect combination! ☕️ What's everyone working on today?",
        username: users[3]?.username || users[0].username,
        userId: users[3]?._id || users[0]._id,
        likes: [users[0]?._id, users[1]?._id, users[2]?._id].filter(Boolean),
        comments: [
          {
            userId: users[0]?._id,
            username: users[0]?.username,
            content: "Working on some React components!",
            createdAt: new Date()
          },
          {
            userId: users[1]?._id,
            username: users[1]?.username,
            content: "Building a new API endpoint!",
            createdAt: new Date()
          }
        ].filter(c => c.userId),
        shares: 2
      },
      {
        content: "Just finished reading an amazing book! 📚 'The Art of Clean Code' - highly recommend it to all developers.",
        username: users[4]?.username || users[0].username,
        userId: users[4]?._id || users[0]._id,
        likes: [users[0]?._id, users[2]?._id].filter(Boolean),
        comments: [
          {
            userId: users[2]?._id,
            username: users[2]?.username,
            content: "Thanks for the recommendation! I'll check it out.",
            createdAt: new Date()
          }
        ].filter(c => c.userId),
        shares: 0
      }
    ];

    // Create posts
    const createdPosts = [];
    for (const postData of samplePosts) {
      const post = new Post(postData);
      await post.save();
      createdPosts.push({
        id: post._id,
        username: post.username,
        content: post.content,
        likes: post.likes.length,
        comments: post.comments.length,
        shares: post.shares,
        createdAt: post.createdAt
      });
    }

    console.log(`✅ Created ${createdPosts.length} sample posts`);

    res.status(201).json({
      message: `Successfully created ${createdPosts.length} sample posts`,
      posts: createdPosts,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sample posts creation error:', error);
    res.status(500).json({
      message: 'Failed to create sample posts',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
