# Snapstream Backend - MVC Architecture

This backend implements a clean MVC (Model-View-Controller) architecture for the Snapstream social media platform with real-time chat functionality.

## 🏗️ Project Structure

```
api/
├── models/           # Database models/schemas
│   ├── User.js       # User model with authentication
│   ├── Post.js       # Post model for social media posts
│   ├── Conversation.js # Chat conversation model
│   └── Message.js    # Chat message model
├── controllers/      # Business logic controllers
│   ├── userController.js    # User authentication & profile
│   ├── postController.js    # Post management
│   └── chatController.js    # Chat functionality
├── routes/           # API route definitions
│   ├── userRoutes.js       # User-related routes
│   ├── postRoutes.js       # Post-related routes
│   └── chatRoutes.js       # Chat-related routes
├── middleware/       # Custom middleware
│   └── auth.js       # Authentication & error handling
├── services/         # Business services
│   └── chatService.js # WebSocket chat service
├── utils/            # Utility functions
│   └── database.js   # Database connection management
└── server-new.js    # Main server file with MVC structure
```

## 🚀 Features

### Authentication & Users
- User registration and login
- JWT token-based authentication
- Profile management
- Follow/unfollow functionality
- Online/offline status tracking

### Social Media Posts
- Create, read, update, delete posts
- Like and comment functionality
- Share posts
- Image upload support
- Public/private post visibility

### Real-Time Chat
- WebSocket-based real-time messaging
- Typing indicators
- Message read receipts
- Online user status
- Conversation management
- Message history
## 🔧 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile/:userId?` - Get user profile
- `PUT /profile` - Update user profile
- `POST /follow/:userId` - Follow/unfollow user
- `POST /logout` - User logout

### Posts (`/api/posts`)
- `GET /` - Get all public posts (feed)
- `GET /user/:userId` - Get user's posts
- `POST /` - Create new post
- `POST /:postId/like` - Like/unlike post
- `POST /:postId/comment` - Add comment
- `POST /:postId/share` - Share post
- `DELETE /:postId` - Delete post

### Chat (`/api/chat`)
- `GET /conversations` - Get user's conversations
- `GET /messages/:conversationId` - Get conversation messages
- `POST /send` - Send message
- `POST /start-conversation` - Start new conversation
- `PATCH /mark-read/:conversationId` - Mark messages as read
- `GET /online-users` - Get online users

### File Upload (`/api/upload`)
- `POST /` - Upload image file

### Health Check (`/health`)
- `GET /` - Server health status

## 🔌 WebSocket Events

### Client → Server
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `send_message` - Send message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_read` - Mark messages as read

### Server → Client
- `new_message` - New message received
- `user_typing` - User typing status
- `messages_read` - Messages marked as read
- `user_status_change` - User online/offline status
- `server_message` - Server-generated message
- `error` - Error message

## 🛠️ Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Create a `.env` file with:
   ```env
   MONGODB_URI=mongodb://localhost:27017/snapstream
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## 📊 Database Models

### User Model
- Authentication fields (username, email, password)
- Profile information (bio, profilePicture)
- Social features (followers, following)
- Online status tracking

### Post Model
- Content and media
- Social interactions (likes, comments, shares)
- Privacy settings
- Author relationship

### Conversation Model
- Participants management
- Last message tracking
- Unread count management
- Active status

### Message Model
- Content and type
- Status tracking (sent, delivered, read)
- Read receipts
- Reply functionality

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Error handling middleware

## 🚀 Performance Optimizations

- Database indexing for better query performance
- Connection pooling
- Efficient WebSocket room management
- Optimized database queries with population
- Graceful error handling

## 📱 Real-Time Features

- Instant message delivery via WebSocket
- Typing indicators
- Online/offline user status
- Message read receipts
- Real-time notifications
- Connection status monitoring

This MVC architecture provides a scalable, maintainable, and feature-rich backend for the Snapstream social media platform with comprehensive real-time chat functionality.
