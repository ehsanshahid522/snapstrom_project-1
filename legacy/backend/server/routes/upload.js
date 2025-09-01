import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload Image
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('👤 User ID:', req.user.id);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }
    
    const { 
      isPrivate = false, 
      caption = '', 
      tags = '' 
    } = req.body;
    
    // Validate user
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    console.log('✅ User found:', user.username);
    
    // Process tags
    const processedTags = tags 
      ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
      : [];
    
    // Create file document
    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      caption: caption.trim(),
      tags: processedTags,
      isPrivate: isPrivate === 'true',
      uploader: req.user.id,
      uploaderUsername: req.user.username,
      uploadTime: new Date(),
      processed: false
    });
    
    console.log('📄 File object created');
    
    // Save to database
    await file.save();
    console.log('✅ File saved successfully to database');
    
    // Return success response
    res.status(201).json({ 
      success: true,
      message: 'Image uploaded successfully', 
      data: {
        _id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        caption: file.caption,
        tags: file.tags,
        isPrivate: file.isPrivate,
        uploaderUsername: file.uploaderUsername,
        uploadTime: file.uploadTime,
        likeCount: file.likeCount,
        commentCount: file.commentCount,
        size: file.size,
        contentType: file.contentType
      }
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Upload failed', 
      error: err.message 
    });
  }
});

// Get image by ID (serve image file)
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        message: 'Image not found' 
      });
    }
    
    // Check if image is private
    if (file.isPrivate) {
      // Add authentication check here if needed
      // For now, allow access to all images
    }
    
    const imagePath = path.join(uploadsDir, file.filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ 
        success: false,
        message: 'Image file not found' 
      });
    }
    
    // Set response headers
    res.set({
      'Content-Type': file.contentType,
      'Content-Length': file.size,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    // Send file
    res.sendFile(imagePath);
    
  } catch (err) {
    console.error('❌ Image retrieval error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve image', 
      error: err.message 
    });
  }
});

export default router;