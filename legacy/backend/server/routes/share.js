import express from 'express';
import File from '../models/File.js';
import User from '../models/User.js';

const router = express.Router();

// Get shared post
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploader', 'username profilePicture')
      .populate('likes', 'username')
      .populate('comments.user', 'username');
    
    if (!file) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if post is private
    if (file.isPrivate) {
      return res.status(403).json({ message: 'This post is private' });
    }
    
    res.json(file);
  } catch (err) {
    res.status(400).json({ message: 'Could not get shared post', error: err.message });
  }
});

export default router; 