# 📸 SnapStream - Photo Feed Web App

A modern, full-stack photo sharing application built with Node.js, Express, MongoDB, and vanilla JavaScript. Share your moments with friends and family through a beautiful, responsive interface.

## ✨ Features

### 🔐 Authentication
- User registration and login with JWT tokens
- Secure password hashing with bcryptjs
- Protected routes and middleware
- User profile management

### 📤 Upload & Sharing
- Drag-and-drop image uploads
- Real-time upload progress tracking
- Support for multiple image formats (JPEG, PNG, GIF)
- File size validation (5MB limit)
- Private/public post settings
- Caption support for posts

### 🏠 Feed & Discovery
- Real-time photo feed with newest posts first
- Like and comment functionality
- User profile pages with post grids
- Search functionality for users
- Responsive design for all devices

### 💬 Social Features
- Like/unlike posts
- Add and delete comments
- Share posts with unique URLs
- User following system (prepared)
- Private account settings

### 🎨 Modern UI/UX
- Beautiful gradient design
- Mobile-responsive interface
- Smooth animations and transitions
- Progress bars for uploads
- Error handling with user feedback

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd photo-feed-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file:
   ```env
   MONGO_URI=mongodb://localhost:27017/photo-feed-app
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB** (if using local)
   ```bash
   mongod
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
project/
├── server/
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── errorHandler.js  # Centralized error handling
│   ├── models/
│   │   ├── User.js          # User schema
│   │   └── File.js          # Post/File schema
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── upload.js        # File upload routes
│   │   ├── feed.js          # Feed routes
│   │   ├── profile.js       # Profile routes
│   │   ├── interactions.js  # Likes/comments routes
│   │   └── share.js         # Share routes
│   └── server.js            # Main server file
├── public/
│   ├── js/
│   │   ├── index.js         # Main feed page
│   │   ├── login.js         # Login functionality
│   │   ├── register.js      # Registration
│   │   ├── upload.js        # Upload with progress
│   │   ├── profile.js       # Profile management
│   │   ├── settings.js      # Settings page
│   │   ├── share.js         # Shared post view
│   │   └── user-profile.js  # User profile view
│   ├── index.html           # Main feed page
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   ├── upload.html          # Upload page
│   ├── profile.html         # Profile page
│   ├── settings.html        # Settings page
│   ├── share.html           # Shared post page
│   ├── user-profile.html    # User profile page
│   └── style.css            # Main stylesheet
├── uploads/                 # Uploaded images
├── package.json
├── Procfile                 # For deployment
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Upload
- `POST /api/upload` - Upload image with caption

### Feed
- `GET /api/feed` - Get user's feed
- `GET /api/feed/my-posts` - Get user's own posts
- `GET /api/feed/user/:username` - Get specific user's posts
- `DELETE /api/feed/:id` - Delete post

### Profile
- `GET /api/profile/:username` - Get user profile
- `PUT /api/profile/update` - Update profile
- `GET /api/profile/me` - Get current user profile

### Interactions
- `POST /api/interactions/like/:postId` - Like/unlike post
- `POST /api/interactions/comment/:postId` - Add comment
- `GET /api/interactions/comments/:postId` - Get comments
- `DELETE /api/interactions/comment/:postId/:commentId` - Delete comment

### Share
- `GET /api/share/:id` - Get shared post data

## 🎨 Features in Detail

### Upload System
- **Drag & Drop**: Simply drag images onto the upload area
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Validation**: File type and size validation with user feedback
- **Privacy**: Choose between public and private posts
- **Captions**: Add descriptive text to your photos

### Feed System
- **Real-time**: Posts appear immediately after upload
- **Responsive**: Optimized for desktop, tablet, and mobile
- **Interactive**: Like, comment, and share posts
- **Privacy-aware**: Only shows appropriate posts based on privacy settings

### User Profiles
- **Personal Pages**: Each user has a dedicated profile page
- **Post Grids**: View all posts by a specific user
- **Stats**: See follower counts and post statistics
- **Privacy Settings**: Control who can see your posts

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcryptjs for secure password storage
- **File Validation**: Strict file type and size validation
- **CORS Protection**: Cross-origin request handling
- **Error Handling**: Comprehensive error management
- **Input Validation**: Server-side validation for all inputs

## 📱 Mobile Responsiveness

The app is fully responsive and optimized for:
- **Desktop**: Full-featured experience with hover effects
- **Tablet**: Touch-optimized interface
- **Mobile**: Streamlined mobile experience with touch gestures

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   MONGO_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-secure-jwt-secret
   PORT=3000
   ```

2. **Platforms Supported**
   - **Render**: Use the provided `Procfile`
   - **Railway**: Automatic deployment from GitHub
   - **Heroku**: Add buildpack for Node.js
   - **Vercel**: Deploy as Node.js function

3. **Database Setup**
   - Use MongoDB Atlas for cloud database
   - Configure connection string in environment variables
   - Ensure proper network access

## 🧪 Testing

Run the comprehensive test checklist:
```bash
# See TEST_CHECKLIST.md for detailed testing steps
npm start
# Then follow the manual testing steps
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Font Awesome** for icons
- **Google Fonts** for typography
- **MongoDB** for database
- **Express.js** community for the framework

## 📞 Support

If you encounter any issues:
1. Check the [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
2. Verify your environment variables
3. Ensure MongoDB is running
4. Check the browser console for errors

---

**Built with ❤️ using Node.js, Express, and MongoDB** #   s n a p s t r o m _ p r o j e c t - 1  
 