# 📸 SnapStream - Photo Sharing Platform

A modern, full-stack photo sharing and social media platform built with React, Node.js, Express, and MongoDB.

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- MongoDB Atlas account
- Vercel account (for deployment)

### **Local Development**
```bash
# Clone the repository
git clone <your-repo-url>
cd snapstream

# Install dependencies
npm install
cd frontend/client && npm install && cd ../..

# Set up environment variables
cp env.example .env
# Edit .env with your MongoDB connection string and JWT secret

# Start development servers
npm run dev:full
```

### **Deployment**
```bash
# Run the deployment script
./deploy.sh

# Or manually:
git add .
git commit -m "Deploy SnapStream"
git push origin main
```

## 🔧 **Recent Fixes (v1.0.0)**

### **Fixed Issues:**
- ✅ **500 Error on Login**: Resolved import path issues in API server
- ✅ **API Communication**: Fixed frontend-backend communication
- ✅ **Database Connection**: Enhanced MongoDB connection handling
- ✅ **Environment Configuration**: Centralized configuration management

### **Key Changes:**
1. **Inline Schemas**: User and File schemas now defined inline to avoid import issues
2. **Smart API URLs**: Frontend automatically detects environment and sets correct API URL
3. **Enhanced Error Handling**: Better error messages and logging throughout
4. **Improved CORS**: Configured for better cross-origin request handling

## 📁 **Project Structure**

```
snapstream/
├── api/                    # Vercel API functions
│   └── server.js         # Main API server
├── backend/               # Backend server (local development)
│   └── server/
├── frontend/              # Frontend application
│   └── client/
├── docs/                  # Documentation
├── tests/                 # Test files
└── deploy.sh             # Deployment script
```

## 🛠️ **Technology Stack**

### **Frontend**
- React 18
- Vite
- Tailwind CSS
- React Router

### **Backend**
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Multer (file uploads)

### **Deployment**
- Vercel (Frontend & Backend)
- MongoDB Atlas

## 🔐 **Environment Variables**

### **Backend (Vercel)**
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/snapstream
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### **Frontend (Vercel)**
```bash
VITE_API_URL=https://snapstream-backend.vercel.app
NODE_ENV=production
```

## 🧪 **Testing**

```bash
# Test backend endpoints
node test-simple.js

# Test deployment
./deploy.sh test
```

## 📊 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset

### **Files**
- `POST /api/upload` - Upload files
- `GET /api/feed` - Get feed
- `GET /api/explore` - Explore files

### **Health & Testing**
- `GET /health` - Health check
- `GET /api/test/ping` - API ping
- `GET /api/test/env` - Environment check
- `GET /api/test/db` - Database connection

## 🚀 **Deployment Status**

- ✅ **Backend**: Ready for deployment
- ✅ **Frontend**: Ready for deployment
- ✅ **Database**: MongoDB Atlas configured
- ✅ **Environment**: Variables documented

## 📝 **Recent Updates**

### **v1.0.0** (Latest)
- Fixed 500 error on login
- Added inline schemas to avoid import issues
- Created centralized configuration
- Enhanced error handling
- Added comprehensive testing scripts
- Created deployment automation

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details

## 🆘 **Support**

If you encounter issues:

1. Check the [DEBUG_AND_DEPLOYMENT_GUIDE.md](DEBUG_AND_DEPLOYMENT_GUIDE.md)
2. Review the [FINAL_FIX_SUMMARY.md](FINAL_FIX_SUMMARY.md)
3. Run the test scripts: `node test-simple.js`
4. Check Vercel function logs

---

**Status**: ✅ Ready for Production  
**Version**: 1.0.0  
**Last Updated**: 2024-01-01