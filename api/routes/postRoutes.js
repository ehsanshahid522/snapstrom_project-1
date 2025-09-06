import express from 'express';
import {
  createPost,
  getPosts,
  getUserPosts,
  toggleLike,
  addComment,
  sharePost,
  deletePost
} from '../controllers/postController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getPosts);
router.get('/user/:userId', getUserPosts);

// Protected routes
router.use(authenticateToken);

router.post('/', createPost);
router.post('/:postId/like', toggleLike);
router.post('/:postId/comment', addComment);
router.post('/:postId/share', sharePost);
router.delete('/:postId', deletePost);

export default router;
