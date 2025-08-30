import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import File from '../models/File.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');
console.log('📁 Uploads directory path:', uploadsDir);

// Check if uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('📁 Saving file to:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + '-' + file.originalname;
    console.log('📄 Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
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
    console.log('Upload request received');
    console.log('User ID:', req.user.id);
    console.log('File:', req.file);
    console.log('Body:', req.body);
    
    const { isPrivate = false, caption = '' } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', user.username);
    
    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploader: req.user.id,
      uploaderUsername: req.user.username,
      caption: caption,
      isPrivate: isPrivate,
      uploadTime: new Date()
    });
    
    console.log('File object created:', file);
    
    await file.save();
    console.log('File saved successfully');
    
    res.status(201).json({ 
      message: 'File uploaded successfully', 
      file: {
        _id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        caption: file.caption,
        isPrivate: file.isPrivate,
        uploaderUsername: file.uploaderUsername,
        uploadTime: file.uploadTime
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(400).json({ message: 'Upload error', error: err.message });
  }
});

export default router;