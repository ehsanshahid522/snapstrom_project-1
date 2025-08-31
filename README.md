# Snapstream - Photo Sharing Platform

A modern, full-stack photo sharing and social media platform built with React, Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd snapstream
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Install dependencies**:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend/client
   npm install
   ```

4. **Start the development servers**:
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend/client directory)
   npm run dev
   ```

5. **Test the application**:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

## 🛠️ Features

- **User Authentication**: Register, login, and JWT-based authentication
- **Photo Upload**: Upload images with captions and privacy settings
- **Social Feed**: View and interact with photos from other users
- **Like & Comment**: Engage with posts through likes and comments
- **User Profiles**: View user profiles and follow/unfollow users
- **Privacy Controls**: Make posts private or public
- **Responsive Design**: Works on desktop and mobile devices

## 📁 Project Structure

```
snapstream/
├── backend/                 # Backend API
│   ├── server/
│   │   ├── middleware/     # Authentication & error handling
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── vercel.json
├── frontend/               # Frontend React app
│   ├── client/
│   │   ├── src/
│   │   │   ├── components/ # React components
│   │   │   ├── pages/      # Page components
│   │   │   ├── lib/        # API utilities
│   │   │   └── main.jsx    # App entry point
│   │   ├── package.json
│   │   └── vite.config.js
│   └── vercel.json
├── docs/                   # Documentation
├── DEPLOYMENT.md          # Deployment guide
└── README.md
```

## 🚀 Deployment

### Option 1: Deploy to Vercel (Recommended)

Follow the detailed deployment guide in [DEPLOYMENT.md](./DEPLOYMENT.md)

### Option 2: Manual Deployment

1. **Deploy Backend**:
   - Set up MongoDB Atlas
   - Deploy to your preferred hosting (Heroku, Railway, etc.)
   - Set environment variables

2. **Deploy Frontend**:
   - Build the React app: `npm run build`
   - Deploy to Vercel, Netlify, or any static hosting
   - Set `VITE_API_URL` environment variable

## 🔧 Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/snapstream
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
PORT=3000
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.vercel.app
```

## 🧪 Testing

### Database Connection Test
```bash
cd backend
node test-db.js
```

### API Health Check
```bash
curl https://your-backend-url.vercel.app/health
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- File upload restrictions
- Rate limiting (can be added)

## 📊 Database Schema

### Users Collection
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  profilePicture: String,
  bio: String,
  followers: [ObjectId],
  following: [ObjectId]
}
```

### Files Collection
```javascript
{
  filename: String,
  originalName: String,
  contentType: String,
  size: Number,
  caption: String,
  tags: [String],
  isPrivate: Boolean,
  uploader: ObjectId (ref: User),
  uploaderUsername: String,
  likes: [ObjectId],
  comments: [{
    user: ObjectId,
    username: String,
    text: String,
    createdAt: Date
  }],
  uploadTime: Date
}
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS settings in `backend/server/server.js`
2. **MongoDB Connection**: Verify your MongoDB URI and network access
3. **File Uploads**: Check file size limits and storage permissions
4. **Environment Variables**: Ensure all required variables are set

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you need help:

1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review the troubleshooting section
3. Check the Vercel deployment logs
4. Verify your environment variables

## 🚀 Future Enhancements

- [ ] Real-time notifications
- [ ] Image filters and editing
- [ ] Stories feature
- [ ] Direct messaging
- [ ] Advanced search
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Cloud storage integration