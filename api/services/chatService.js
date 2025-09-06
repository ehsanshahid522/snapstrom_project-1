import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

class ChatService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.typingUsers = new Map(); // conversationId -> Set of userIds
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(this.authenticateSocket.bind(this));
    
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, socket.userId);
      
      // Update user online status
      this.updateUserOnlineStatus(socket.userId, true);
      
      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // Handle joining conversation rooms
      socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      });
      
      // Handle leaving conversation rooms
      socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
      });
      
      // Handle sending messages
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });
      
      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });
      
      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });
      
      // Handle message read status
      socket.on('mark_read', async (data) => {
        await this.handleMarkRead(socket, data);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  async handleSendMessage(socket, data) {
    try {
      const { conversationId, content, type = 'text' } = data;
      
      // Verify conversation exists and user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': socket.userId,
        isActive: true
      });
      
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }
      
      // Create message
      const message = new Message({
        conversation: conversationId,
        sender: socket.userId,
        content,
        type,
        status: 'sent'
      });
      
      await message.save();
      await message.populate('sender', 'username profilePicture');
      
      // Update conversation last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          content,
          sender: socket.userId,
          timestamp: message.createdAt
        },
        updatedAt: new Date()
      });
      
      // Emit message to all participants in the conversation
      this.io.to(`conversation_${conversationId}`).emit('new_message', {
        id: message._id,
        content: message.content,
        senderId: message.sender._id,
        senderUsername: message.sender.username,
        timestamp: message.createdAt,
        type: message.type,
        status: message.status
      });
      
      // Update unread counts for other participants
      await this.updateUnreadCounts(conversationId, socket.userId);
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleTypingStart(socket, data) {
    const { conversationId } = data;
    
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    
    this.typingUsers.get(conversationId).add(socket.userId);
    
    // Emit typing indicator to other participants
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      conversationId,
      userId: socket.userId,
      username: socket.username,
      isTyping: true
    });
    
    // Clear typing indicator after 3 seconds
    setTimeout(() => {
      this.handleTypingStop(socket, data);
    }, 3000);
  }

  handleTypingStop(socket, data) {
    const { conversationId } = data;
    
    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId).delete(socket.userId);
      
      // Emit typing stop to other participants
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        username: socket.username,
        isTyping: false
      });
    }
  }

  async handleMarkRead(socket, data) {
    try {
      const { conversationId } = data;
      
      // Mark messages as read
      await Message.updateMany(
        { 
          conversation: conversationId,
          sender: { $ne: socket.userId },
          'readBy.user': { $ne: socket.userId }
        },
        { 
          $push: { 
            readBy: { 
              user: socket.userId, 
              readAt: new Date() 
            } 
          },
          status: 'read'
        }
      );
      
      // Reset unread count
      await Conversation.updateOne(
        { _id: conversationId, 'participants.user': socket.userId },
        { $set: { 'participants.$.unreadCount': 0 } }
      );
      
      // Emit read status to other participants
      socket.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        userId: socket.userId,
        username: socket.username
      });
      
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  async updateUnreadCounts(conversationId, senderId) {
    try {
      await Conversation.updateMany(
        { 
          _id: conversationId,
          'participants.user': { $ne: senderId }
        },
        { 
          $inc: { 'participants.$.unreadCount': 1 }
        }
      );
    } catch (error) {
      console.error('Update unread counts error:', error);
    }
  }

  async updateUserOnlineStatus(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date()
      });
      
      // Emit online status to all connected users
      this.io.emit('user_status_change', {
        userId,
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Update online status error:', error);
    }
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.userId}`);
    
    // Remove user from connected users
    this.connectedUsers.delete(socket.userId);
    this.userSockets.delete(socket.id);
    
    // Update user offline status
    this.updateUserOnlineStatus(socket.userId, false);
    
    // Clear typing indicators
    for (const [conversationId, typingSet] of this.typingUsers.entries()) {
      if (typingSet.has(socket.userId)) {
        typingSet.delete(socket.userId);
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.userId,
          username: socket.username,
          isTyping: false
        });
      }
    }
  }

  // Method to send message from server (for API fallback)
  sendMessageToUser(userId, message) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('server_message', message);
      return true;
    }
    return false;
  }

  // Method to get online users
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}

export default ChatService;
