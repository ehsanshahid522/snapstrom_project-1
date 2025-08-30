import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import auth from '../middleware/auth.js';

const router = express.Router();

// Debug logging for auth routes
router.use((req, res, next) => {
  console.log(`[AUTH ROUTER] ${req.method} ${req.path}`);
  next();
});

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Configure multer for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Registration (no OTP)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    await user.save();
    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Registration error', error: err.message });
  }
});

// Forgot/Reset password without OTP: provide email + newPassword
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and newPassword are required' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Reset password error', error: err.message });
  }
});

// Change password (authenticated, with current password)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Change password error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// Upload profile picture
router.post('/profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user's profile picture
    user.profilePicture = req.file.filename;
    await user.save();
    
    res.json({ 
      message: 'Profile picture updated successfully',
      profilePicture: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update account settings
router.put('/account-settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { isPrivateAccount, bio } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isPrivateAccount = isPrivateAccount;
    user.bio = bio;
    await user.save();
    
    res.json({ 
      message: 'Account settings updated successfully',
      isPrivateAccount: user.isPrivateAccount,
      bio: user.bio
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;
    
    console.log('Profile request:', { username, currentUserId });
    
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      console.log('User not found:', username);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found user:', { 
      _id: user._id, 
      username: user.username, 
      followersCount: user.followers.length,
      followingCount: user.following.length
    });
    
    // Always allow users to view their own profile
    const isOwnProfile = user._id.toString() === currentUserId;
    
    // Check if current user can view this profile (for other users)
    const canView = isOwnProfile || !user.isPrivateAccount || user.followers.some(id => id.toString() === currentUserId);
    
    console.log('Profile access:', { isOwnProfile, canView, isPrivateAccount: user.isPrivateAccount });
    
    if (!canView) {
      return res.status(403).json({ message: 'This account is private' });
    }
    
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isPrivateAccount: user.isPrivateAccount,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt
      },
      canView,
      isOwnProfile
    });
  } catch (error) {
    console.error('Profile route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;
    
    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }
    
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: currentUserId }
    })
    .select('username profilePicture isPrivateAccount')
    .limit(10);
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow/Unfollow user
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    
    console.log('Follow request:', { currentUserId, targetUserId });
    
    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }
    
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    
    if (!currentUser || !targetUser) {
      console.log('User not found:', { currentUser: !!currentUser, targetUser: !!targetUser });
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found users:', {
      currentUser: { _id: currentUser._id, username: currentUser.username },
      targetUser: { _id: targetUser._id, username: targetUser.username }
    });
    
    const isFollowing = currentUser.following.some(id => id.toString() === targetUserId);
    
    console.log('Follow status:', { isFollowing, currentUserFollowing: currentUser.following, targetUserFollowers: targetUser.followers });
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
      console.log('Unfollowing user');
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      console.log('Following user');
    }
    
    await currentUser.save();
    await targetUser.save();
    
    console.log('Updated users:', {
      currentUserFollowing: currentUser.following,
      targetUserFollowers: targetUser.followers
    });
    
    res.json({ 
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error('Follow route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get follow status for a user
router.get('/follow-status/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    
    if (currentUserId === targetUserId) {
      return res.json({ isFollowing: false, message: 'Cannot follow yourself' });
    }
    
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    const isFollowing = currentUser.following.some(id => id.toString() === targetUserId);
    
    res.json({ isFollowing });
  } catch (err) {
    console.error('Follow status error:', err);
    res.status(400).json({ message: 'Could not get follow status', error: err.message });
  }
});

export default router;