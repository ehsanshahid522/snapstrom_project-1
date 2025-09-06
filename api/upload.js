// CommonJS version for Vercel - Upload Function
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
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

    // Parse multipart form data
    const formData = await new Promise((resolve, reject) => {
      upload.single('image')(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(req);
        }
      });
    });

    const { content, userId, username } = formData.body;
    const imageFile = formData.file;

    if (!content || !userId || !username) {
      return res.status(400).json({ 
        message: 'Content, userId, and username are required' 
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let imageUrl = '';
    
    // Handle image upload if provided
    if (imageFile) {
      try {
        // Generate unique filename
        const fileExtension = path.extname(imageFile.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
        
        // For now, we'll store the image data as base64 in the database
        // In production, you'd want to upload to a cloud storage service
        const base64Image = imageFile.buffer.toString('base64');
        imageUrl = `data:${imageFile.mimetype};base64,${base64Image}`;
        
      } catch (imageError) {
        console.error('Image processing error:', imageError);
        return res.status(500).json({ 
          message: 'Failed to process image',
          error: imageError.message 
        });
      }
    }

    // Create new post
    const newPost = new Post({
      userId: userId,
      username: username,
      content: content,
      imageUrl: imageUrl,
      likes: [],
      comments: [],
      shares: 0,
      isPrivate: false
    });

    await newPost.save();

    console.log(`✅ Post created successfully by ${username}`);

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: newPost._id,
        userId: newPost.userId,
        username: newPost.username,
        content: newPost.content,
        imageUrl: newPost.imageUrl,
        likes: newPost.likes.length,
        comments: newPost.comments.length,
        shares: newPost.shares,
        isPrivate: newPost.isPrivate,
        createdAt: newPost.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Upload failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
