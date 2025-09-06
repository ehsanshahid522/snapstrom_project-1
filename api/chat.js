// CommonJS version for Vercel - Chat Function
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// RADICAL CORS SETUP
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// User Schema
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true
  },
  password: { 
    type: String, 
    required: true 
  },
  profilePicture: { 
    type: String, 
    default: '' 
  },
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  following: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Conversation Schema
const ConversationSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }],
  lastMessage: {
    content: String,
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Message Schema
const MessageSchema = new mongoose.Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    default: 'text' 
  },
  status: { 
    type: String, 
    default: 'sent',
    enum: ['sent', 'delivered', 'read']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Ensure models are not re-registered
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI environment variable is not set.');
        throw new Error('Database connection string not configured.');
      }
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected for chat');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// RADICAL OPTIONS HANDLER
app.options('*', (req, res) => {
  console.log('🚨 CHAT OPTIONS handler for:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// GET CONVERSATIONS ENDPOINT
app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  console.log('💬 CONVERSATIONS request');
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const currentUserId = req.user.userId;
    
    const conversations = await Conversation.find({
      participants: currentUserId
    })
    .populate('participants', 'username profilePicture')
    .populate('lastMessage.sender', 'username')
    .sort({ updatedAt: -1 });
    
    res.json({
      conversations: conversations.map(conv => ({
        id: conv._id,
        participants: conv.participants.map(p => ({
          id: p._id,
          username: p.username,
          profilePicture: p.profilePicture
        })),
        lastMessage: conv.lastMessage,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }))
    });
    
  } catch (error) {
    console.error('🚨 Conversations error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch conversations', 
      error: error.message 
    });
  }
});

// GET MESSAGES ENDPOINT
app.get('/api/chat/messages/:conversationId', authenticateToken, async (req, res) => {
  console.log('💬 MESSAGES request for:', req.params.conversationId);
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { conversationId } = req.params;
    const currentUserId = req.user.userId;
    
    // Verify user is participant in conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(currentUserId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const messages = await Message.find({ conversationId })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: 1 });
    
    res.json({
      messages: messages.map(msg => ({
        id: msg._id,
        conversationId: msg.conversationId,
        sender: {
          id: msg.sender._id,
          username: msg.sender.username,
          profilePicture: msg.sender.profilePicture
        },
        content: msg.content,
        type: msg.type,
        status: msg.status,
        createdAt: msg.createdAt
      }))
    });
    
  } catch (error) {
    console.error('🚨 Messages error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch messages', 
      error: error.message 
    });
  }
});

// SEND MESSAGE ENDPOINT
app.post('/api/chat/send', authenticateToken, async (req, res) => {
  console.log('💬 SEND MESSAGE request');
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { conversationId, content, type = 'text' } = req.body;
    const currentUserId = req.user.userId;
    
    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Conversation ID and content are required' });
    }
    
    // Verify user is participant in conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(currentUserId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Create message
    const message = new Message({
      conversationId,
      sender: currentUserId,
      content,
      type
    });
    
    await message.save();
    
    // Update conversation last message
    conversation.lastMessage = {
      content,
      sender: currentUserId,
      timestamp: new Date()
    };
    conversation.updatedAt = new Date();
    await conversation.save();
    
    // Populate sender info
    await message.populate('sender', 'username profilePicture');
    
    res.json({
      message: {
        id: message._id,
        conversationId: message.conversationId,
        sender: {
          id: message.sender._id,
          username: message.sender.username,
          profilePicture: message.sender.profilePicture
        },
        content: message.content,
        type: message.type,
        status: message.status,
        createdAt: message.createdAt
      }
    });
    
  } catch (error) {
    console.error('🚨 Send message error:', error);
    res.status(500).json({ 
      message: 'Failed to send message', 
      error: error.message 
    });
  }
});

// START CONVERSATION ENDPOINT
app.post('/api/chat/start-conversation', authenticateToken, async (req, res) => {
  console.log('💬 START CONVERSATION request');
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { username } = req.body;
    const currentUserId = req.user.userId;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user._id.toString() === currentUserId) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, user._id] }
    }).populate('participants', 'username profilePicture');
    
    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [currentUserId, user._id]
      });
      await conversation.save();
      await conversation.populate('participants', 'username profilePicture');
    }
    
    res.json({
      conversation: {
        id: conversation._id,
        participants: conversation.participants.map(p => ({
          id: p._id,
          username: p.username,
          profilePicture: p.profilePicture
        })),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
    
  } catch (error) {
    console.error('🚨 Start conversation error:', error);
    res.status(500).json({ 
      message: 'Failed to start conversation', 
      error: error.message 
    });
  }
});

// MARK AS READ ENDPOINT
app.post('/api/chat/mark-read/:conversationId', authenticateToken, async (req, res) => {
  console.log('💬 MARK READ request for:', req.params.conversationId);
  
  // FORCE CORS HEADERS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  try {
    await connectDB();
    
    const { conversationId } = req.params;
    const currentUserId = req.user.userId;
    
    // Update all messages in conversation to read status
    await Message.updateMany(
      { 
        conversationId, 
        sender: { $ne: currentUserId },
        status: { $ne: 'read' }
      },
      { status: 'read' }
    );
    
    res.json({ message: 'Messages marked as read' });
    
  } catch (error) {
    console.error('🚨 Mark read error:', error);
    res.status(500).json({ 
      message: 'Failed to mark messages as read', 
      error: error.message 
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 CHAT Global error handler:', error);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (!res.headersSent) {
    res.status(500).json({
      message: 'Internal server error from chat',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = app;
