# SnapStream - Photo Sharing Platform

A modern, full-stack photo sharing and social media platform built with React, Node.js, Express, and MongoDB.

## Features

- 📸 **Photo Upload & Sharing**: Upload and share photos with captions and tags
- 👥 **User Authentication**: Secure registration and login system
- 👤 **User Profiles**: Customizable profiles with bio and profile pictures
- 🔗 **Social Features**: Follow/unfollow users, like posts, and comment
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔍 **Search**: Search for users and discover content
- 📊 **Trending**: View trending posts based on engagement
- 🔒 **Privacy**: Private posts and account settings

## Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **Multer** - File upload handling

## Deployment

This project is configured for deployment on Vercel.

### Environment Variables

Set these environment variables in your Vercel dashboard:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens

### Build Process

1. Frontend builds to `frontend/client/dist/`
2. Backend API runs as serverless functions
3. Static files served from frontend build

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Posts
- `GET /api/feed` - Get public posts
- `GET /api/feed/following` - Get posts from followed users
- `GET /api/trending` - Get trending posts
- `POST /api/upload` - Upload a new post
- `DELETE /api/post/:id` - Delete a post

### Users
- `GET /api/profile` - Get current user profile
- `GET /api/profile/:username` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/follow/:userId` - Follow/unfollow user

### Interactions
- `POST /api/like/:postId` - Like/unlike post
- `POST /api/comment/:postId` - Add comment
- `GET /api/comments/:postId` - Get post comments

### Media
- `GET /api/images/:fileId` - Serve uploaded images

## Development

### Prerequisites
- Node.js 18+
- npm 8+
- MongoDB database

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run dev`

## License

MIT License - see LICENSE file for details.

## Author

Ehsan Shahid