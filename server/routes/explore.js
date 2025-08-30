import express from 'express';
import { Router } from 'express';
import File from '../models/File.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = Router();

// Get trending posts (most liked and commented posts)
router.get('/trending', auth, async (req, res) => {
  try {
    const trendingPosts = await File.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'uploader',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $size: { $ifNull: ['$likes', []] } },
              { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 2] }
            ]
          }
        }
      },
      {
        $sort: { engagementScore: -1, uploadTime: -1 }
      },
      {
        $limit: 12
      },
      {
        $project: {
          _id: 1,
          filename: 1,
          caption: 1,
          likes: 1,
          comments: 1,
          uploadTime: 1,
          'user.username': 1,
          'user.profilePicture': 1,
          engagementScore: 1
        }
      }
    ])

    res.json({ posts: trendingPosts })
  } catch (error) {
    console.error('Error fetching trending posts:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get popular users (most followers and posts)
router.get('/popular-users', auth, async (req, res) => {
  try {
    const popularUsers = await User.aggregate([
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $size: { $ifNull: ['$followers', []] } },
              { $multiply: [{ $size: { $ifNull: ['$files', []] } }, 5] }
            ]
          }
        }
      },
      {
        $sort: { popularityScore: -1 }
      },
      {
        $limit: 8
      },
      {
        $project: {
          _id: 1,
          username: 1,
          avatar: 1,
          bio: 1,
          followers: { $size: { $ifNull: ['$followers', []] } },
          following: { $size: { $ifNull: ['$following', []] } },
          files: { $size: { $ifNull: ['$files', []] } },
          popularityScore: 1
        }
      }
    ])

    res.json({ users: popularUsers })
  } catch (error) {
    console.error('Error fetching popular users:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get content categories with post counts
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await File.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $project: {
          id: '$_id',
          name: { $toUpper: { $substr: ['$_id', 0, 1] } + { $substr: ['$_id', 1, -1] } },
          count: 1
        }
      }
    ])

    // Add default categories if none exist
    const defaultCategories = [
      { id: 'photography', name: 'Photography', count: 0 },
      { id: 'travel', name: 'Travel', count: 0 },
      { id: 'food', name: 'Food', count: 0 },
      { id: 'art', name: 'Art', count: 0 },
      { id: 'technology', name: 'Technology', count: 0 },
      { id: 'lifestyle', name: 'Lifestyle', count: 0 }
    ]

    // Merge existing categories with defaults
    const mergedCategories = defaultCategories.map(defaultCat => {
      const existingCat = categories.find(cat => cat.id === defaultCat.id)
      return existingCat || defaultCat
    })

    res.json({ categories: mergedCategories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get posts by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params
    const { page = 1, limit = 12 } = req.query

    const posts = await File.find({ category })
      .populate('uploader', 'username profilePicture')
      .sort({ uploadTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    const total = await File.countDocuments({ category })

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error) {
    console.error('Error fetching posts by category:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Search posts and users
router.get('/search', auth, async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' })
    }

    const results = {}

    if (type === 'all' || type === 'posts') {
            const posts = await File.find({
        $or: [
          { filename: { $regex: query, $options: 'i' } },
          { caption: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('uploader', 'username profilePicture')
      .limit(10)
      .sort({ uploadTime: -1 })

      results.posts = posts
    }

    if (type === 'all' || type === 'users') {
      const users = await User.find({
        username: { $regex: query, $options: 'i' }
      })
      .select('username avatar bio followers')
      .limit(10)

      results.users = users
    }

    res.json(results)
  } catch (error) {
    console.error('Error searching:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router;
