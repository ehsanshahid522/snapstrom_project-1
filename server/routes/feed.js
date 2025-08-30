import express from 'express';
import File from '../models/File.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Debug route to check database content (remove in production)
router.get('/debug', async (req, res) => {
  try {
    const totalFiles = await File.countDocuments();
    const totalUsers = await User.countDocuments();
    const sampleFiles = await File.find().limit(3);
    const sampleUsers = await User.find().limit(3);
    
    res.json({
      stats: {
        totalFiles,
        totalUsers
      },
      sampleFiles,
      sampleUsers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get feed: show all public posts (including own posts for now)
router.get('/', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    console.log('Feed request from user:', currentUserId); // Debug log
    
    // First, let's check what's in the database
    const totalFiles = await File.countDocuments();
    const privateFiles = await File.countDocuments({ isPrivate: true });
    const publicFiles = await File.countDocuments({ isPrivate: false });
    
    console.log('Database stats - Total:', totalFiles, 'Private:', privateFiles, 'Public:', publicFiles);
    
    // Get all public posts for now (including own posts)
    const files = await File.find({
      isPrivate: false
    })
    .populate('uploader', 'username profilePicture _id')
    .populate('likes', 'username _id')
    .populate('comments.user', 'username _id')
    .sort({ uploadTime: -1 });
    
    console.log('Found files:', files.length); // Debug log
    if (files.length > 0) {
      console.log('Sample file:', JSON.stringify(files[0], null, 2)); // Debug log
    }
    
    res.json(files);
  } catch (err) {
    console.error('Feed error:', err); // Debug log
    res.status(400).json({ message: 'Could not get feed', error: err.message });
  }
});

// Get user's own posts
router.get('/my-posts', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const files = await File.find({ uploader: currentUserId })
      .populate('uploader', 'username profilePicture _id')
      .populate('likes', 'username _id')
      .populate('comments.user', 'username _id')
      .sort({ uploadTime: -1 });
    
    res.json(files);
  } catch (err) {
    res.status(400).json({ message: 'Could not get posts', error: err.message });
  }
});

// Get following feed - posts from users the current user follows
router.get('/following', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get current user to find who they're following
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user is not following anyone, return empty array
    if (!currentUser.following || currentUser.following.length === 0) {
      return res.json([]);
    }
    
    // Get posts from users the current user follows (only public posts)
    const files = await File.find({
      uploader: { $in: currentUser.following },
      isPrivate: false
    })
      .populate('uploader', 'username profilePicture _id')
      .populate('likes', 'username _id')
      .populate('comments.user', 'username _id')
      .sort({ uploadTime: -1 });
    
    console.log('Following feed - found files:', files.length);
    res.json(files);
  } catch (err) {
    console.error('Following feed error:', err);
    res.status(400).json({ message: 'Could not get following feed', error: err.message });
  }
});

// Get posts by specific user
router.get('/user/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;
    
    console.log('User posts request for:', username, 'from user:', currentUserId); // Debug log
    
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      console.log('User not found:', username); // Debug log
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Target user found:', targetUser._id); // Debug log
    
    // Check if current user can view this user's posts
    const canView = !targetUser.isPrivateAccount || 
                   targetUser._id.toString() === String(currentUserId) ||
                   targetUser.followers.some(id => id.toString() === String(currentUserId));
    
    console.log('Can view:', canView); // Debug log
    
    if (!canView) {
      return res.status(403).json({ message: 'This account is private' });
    }
    
    // Check if current user is viewing their own profile
    const isOwnProfile = targetUser._id.toString() === String(currentUserId);
    
    let files;
    if (isOwnProfile) {
      // If viewing own profile, show all posts (public + private)
      files = await File.find({ uploader: targetUser._id })
        .populate('uploader', 'username profilePicture _id')
        .populate('likes', 'username _id')
        .populate('comments.user', 'username _id')
        .sort({ uploadTime: -1 });
      console.log('Own profile - showing all posts (public + private):', files.length);
    } else {
      // If viewing someone else's profile, only show public posts
      files = await File.find({ 
        uploader: targetUser._id,
        isPrivate: false 
      })
        .populate('uploader', 'username profilePicture _id')
        .populate('likes', 'username _id')
        .populate('comments.user', 'username _id')
        .sort({ uploadTime: -1 });
      console.log('Other profile - showing only public posts:', files.length);
    }
    
    console.log('Found files for user:', files.length); // Debug log
    
    res.json(files);
  } catch (err) {
    console.error('User posts error:', err); // Debug log
    res.status(400).json({ message: 'Could not get user posts', error: err.message });
  }
});



// Delete a post
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    
    // Check if user owns the post
    if (file.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    
    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Delete error', error: err.message });
  }
});

export default router;