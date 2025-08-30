import express from 'express';
import File from '../models/File.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Like/Unlike a post
router.post('/like/:postId', auth, async (req, res) => {
  try {
    const post = await File.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.findIndex(id => id.toString() === String(req.user.id));
    
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.id);
    }
    
    await post.save();
    
    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      likes: post.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to a post
router.post('/comment/:postId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await File.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user.id);
    
    const comment = {
      user: req.user.id,
      username: user.username,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();
    
    res.json({
      message: 'Comment added successfully',
      comment: {
        _id: comment._id,
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt
      },
      totalComments: post.comments.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post
router.get('/comments/:postId', async (req, res) => {
  try {
    const post = await File.findById(req.params.postId)
      .populate('comments.user', 'username profilePicture')
      .select('comments');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      comments: post.comments.map(comment => ({
        _id: comment._id,
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment (only by comment author)
router.delete('/comment/:postId/:commentId', auth, async (req, res) => {
  try {
    const post = await File.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await post.save();
    
    res.json({
      message: 'Comment deleted successfully',
      totalComments: post.comments.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 