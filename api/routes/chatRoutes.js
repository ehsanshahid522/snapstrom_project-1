import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  getOnlineUsers
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All chat routes require authentication
router.use(authenticateToken);

// Get all conversations for the authenticated user
router.get('/conversations', getConversations);

// Get messages for a specific conversation
router.get('/messages/:conversationId', getMessages);

// Send a message
router.post('/send', sendMessage);

// Start a new conversation
router.post('/start-conversation', startConversation);

// Mark messages as read
router.patch('/mark-read/:conversationId', markAsRead);

// Get online users
router.get('/online-users', getOnlineUsers);

export default router;
