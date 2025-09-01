import express from 'express';
import File from '../models/File.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all public posts (feed)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { uploadTime: 1 };
        break;
      case 'popular':
        sortObj = { likeCount: -1, uploadTime: -1 };
        break;
      case 'newest':
      default:
        sortObj = { uploadTime: -1 };
        break;
    }
    
    // Get posts with pagination
    const posts = await File.find({ isPrivate: false })
      .populate('uploader', 'username profilePicture')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-imageData -thumbnailData') // Don't send image data in feed
      .lean();
    
    // Get total count for pagination
    const total = await File.countDocuments({ isPrivate: false });
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });
    
  } catch (err) {
    console.error('❌ Feed error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed',
      error: err.message
    });
  }
});

// Get user's posts (authenticated)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if user is requesting their own posts or if posts are public
    const isOwnPosts = req.user.id === userId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { uploader: userId };
    
    // If not own posts, only show public posts
    if (!isOwnPosts) {
      query.isPrivate = false;
    }
    
    const posts = await File.find(query)
      .populate('uploader', 'username profilePicture')
      .sort({ uploadTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-imageData -thumbnailData')
      .lean();
    
    const total = await File.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
    
  } catch (err) {
    console.error('❌ User posts error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts',
      error: err.message
    });
  }
});

// Get single post by ID
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await File.findById(postId)
      .populate('uploader', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .select('-imageData -thumbnailData')
      .lean();
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if post is private
    if (post.isPrivate) {
      // Add authentication check here if needed
      // For now, allow access to all posts
    }
    
    res.json({
      success: true,
      data: post
    });
    
  } catch (err) {
    console.error('❌ Single post error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: err.message
    });
  }
});

// Search posts by caption or tags
router.get('/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Text search in caption and tags
    const posts = await File.find(
      { 
        $text: { $search: query },
        isPrivate: false 
      },
      { score: { $meta: "textScore" } }
    )
      .populate('uploader', 'username profilePicture')
      .sort({ score: { $meta: "textScore" }, uploadTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-imageData -thumbnailData')
      .lean();
    
    const total = await File.countDocuments({ 
      $text: { $search: query },
      isPrivate: false 
    });
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
    
  } catch (err) {
    console.error('❌ Search error:', err);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: err.message
    });
  }
});

// Get trending posts (most liked in last 7 days)
router.get('/trending', async (req, res) => {
  try {
    const { period = 'week', page = 1, limit = 20 } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'day':
        dateFilter = { uploadTime: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
        break;
      case 'week':
        dateFilter = { uploadTime: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'month':
        dateFilter = { uploadTime: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        dateFilter = { uploadTime: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await File.find({
      ...dateFilter,
      isPrivate: false
    })
      .populate('uploader', 'username profilePicture')
      .sort({ likeCount: -1, uploadTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-imageData -thumbnailData')
      .lean();
    
    const total = await File.countDocuments({
      ...dateFilter,
      isPrivate: false
    });
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
    
  } catch (err) {
    console.error('❌ Trending posts error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending posts',
      error: err.message
    });
  }
});

export default router;