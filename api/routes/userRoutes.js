import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  toggleFollow,
  logout,
  searchUsers,
  getFollowers,
  getFollowing
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(authenticateToken);

router.get('/profile/:userId?', getProfile);
router.put('/profile', updateProfile);
router.post('/follow/:userId', toggleFollow);
router.get('/followers/:userId?', getFollowers);
router.get('/following/:userId?', getFollowing);
router.get('/search', searchUsers);
router.post('/logout', logout);

export default router;
