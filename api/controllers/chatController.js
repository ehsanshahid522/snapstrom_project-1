import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const conversations = await Conversation.find({
      'participants.user': userId,
      isActive: true
    })
    .populate('participants.user', 'username profilePicture isOnline lastSeen')
    .populate('lastMessage.sender', 'username')
    .sort({ updatedAt: -1 });

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.user._id.toString() !== userId.toString());
      const unreadCount = conv.participants.find(p => p.user._id.toString() === userId.toString())?.unreadCount || 0;
      
      return {
        id: conv._id,
        participants: conv.participants.map(p => ({
          username: p.user.username,
          profilePicture: p.user.profilePicture,
          isOnline: p.user.isOnline,
          lastSeen: p.user.lastSeen
        })),
        lastMessage: conv.lastMessage?.content || '',
        lastMessageTime: conv.lastMessage?.timestamp || conv.updatedAt,
        unreadCount,
        otherParticipant: otherParticipant ? {
          username: otherParticipant.user.username,
          profilePicture: otherParticipant.user.profilePicture,
          isOnline: otherParticipant.user.isOnline
        } : null
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username profilePicture')
      .populate('replyTo.sender', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      { 
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      { 
        $push: { 
          readBy: { 
            user: userId, 
            readAt: new Date() 
          } 
        },
        status: 'read'
      }
    );

    // Update conversation last read time
    await Conversation.updateOne(
      { _id: conversationId, 'participants.user': userId },
      { $set: { 'participants.$.lastReadAt': new Date() } }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyTo } = req.body;
    const userId = req.user._id;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content,
      type,
      replyTo
    });

    await message.save();
    await message.populate('sender', 'username profilePicture');

    // Update conversation last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content,
        sender: userId,
        timestamp: message.createdAt
      },
      updatedAt: new Date()
    });

    // Increment unread count for other participants
    await Conversation.updateMany(
      { 
        _id: conversationId,
        'participants.user': { $ne: userId }
      },
      { 
        $inc: { 'participants.$.unreadCount': 1 }
      }
    );

    res.status(201).json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        senderId: message.sender._id,
        senderUsername: message.sender.username,
        timestamp: message.createdAt,
        type: message.type,
        status: message.status
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Start a new conversation
export const startConversation = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;

    // Find the user to start conversation with
    const otherUser = await User.findOne({ username });
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (otherUser._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [userId, otherUser._id] },
      isActive: true
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [
          { user: userId, username: req.user.username },
          { user: otherUser._id, username: otherUser.username }
        ]
      });
      await conversation.save();
    }

    res.status(201).json({
      success: true,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start conversation'
    });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { 
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      { 
        $push: { 
          readBy: { 
            user: userId, 
            readAt: new Date() 
          } 
        },
        status: 'read'
      }
    );

    // Reset unread count
    await Conversation.updateOne(
      { _id: conversationId, 'participants.user': userId },
      { $set: { 'participants.$.unreadCount': 0 } }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

// Get online users
export const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true })
      .select('username profilePicture lastSeen')
      .sort({ lastSeen: -1 });

    res.json({
      success: true,
      onlineUsers: onlineUsers.map(user => ({
        username: user.username,
        profilePicture: user.profilePicture,
        lastSeen: user.lastSeen
      }))
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users'
    });
  }
};
