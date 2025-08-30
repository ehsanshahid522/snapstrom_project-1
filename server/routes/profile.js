import express from 'express';
import User from '../models/User.js';
import File from '../models/File.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get current user's profile (must be defined before the `/:username` route)
router.get('/me', auth, async (req, res) => {
  try {
    console.log('[GET /api/profile/me] user from token:', { id: req.user?.id, username: req.user?.username });
    let user = await User.findById(req.user.id).select('-password');
    console.log('[GET /api/profile/me] findById result:', !!user);
    if (!user && req.user.username) {
      // Fallback by username from token
      user = await User.findOne({ username: req.user.username }).select('-password');
      console.log('[GET /api/profile/me] findOne by username result:', !!user);
    }
    if (!user) {
      console.log('[GET /api/profile/me] user not found for', { id: req.user?.id, username: req.user?.username });
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('[GET /api/profile/me] server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile with posts
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts (public only if not the owner)
    const query = { uploaderUsername: username };
    if (!req.user || req.user.username !== username) {
      query.isPrivate = false;
    }

    const posts = await File.find(query)
      .sort({ uploadTime: -1 })
      .limit(20);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isPrivateAccount: user.isPrivateAccount,
        followers: user.followers.length,
        following: user.following.length,
        createdAt: user.createdAt
      },
      posts: posts.map(post => ({
        _id: post._id,
        filename: post.filename,
        caption: post.caption,
        uploadTime: post.uploadTime,
        likes: post.likes.length,
        comments: post.comments.length,
        isPrivate: post.isPrivate
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/update', auth, async (req, res) => {
  try {
    const { bio, isPrivateAccount } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.bio = bio || user.bio;
    user.isPrivateAccount = isPrivateAccount !== undefined ? isPrivateAccount : user.isPrivateAccount;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isPrivateAccount: user.isPrivateAccount
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// (duplicate '/me' route removed – single definition exists above)

export default router; 