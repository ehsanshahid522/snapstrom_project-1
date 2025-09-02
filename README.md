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

### **Automatic Deployment**
This project is configured for automatic deployment using GitHub Actions and Vercel.

#### **Setup Instructions:**
1. **Push to GitHub**: Your code is already connected to GitHub
2. **Set up Vercel**: Follow the [Deployment Guide](DEPLOYMENT_GUIDE.md)
3. **Configure Secrets**: Add required secrets to GitHub repository
4. **Deploy**: Every push to `main` branch triggers automatic deployment

#### **Manual Deployment**
```bash
# Run the deployment script
./deploy.sh

# Or manually:
git add .
git commit -m "Deploy SnapStream"
git push origin main
```

## 🔧 **Recent Fixes (v2.0.0)**

### **Fixed Issues:**
- ✅ **Feed Page**: Fixed API endpoints and data structure mapping
- ✅ **Localhost Code**: Removed all localhost-specific logic
- ✅ **Performance**: Optimized code for production deployment
- ✅ **API Communication**: Corrected backend API calls
- ✅ **Automatic Deployment**: Set up GitHub Actions workflows

### **Key Changes:**
1. **Correct API Endpoints**: Fixed all API routes to match backend structure
2. **Production Optimization**: Removed debug code and localhost references
3. **GitHub Actions**: Added automatic deployment workflows
4. **Data Mapping**: Fixed frontend-backend data structure compatibility

## 📁 **Project Structure**

```
snapstream/
├── .github/workflows/     # GitHub Actions workflows
│   ├── frontend-deploy.yml
│   ├── backend-deploy.yml
│   └── full-deploy.yml
├── api/                   # Vercel API functions
│   └── server.js         # Main API server
├── legacy/backend/        # Backend server (local development)
│   └── server/
├── frontend/              # Frontend application
│   └── client/
├── docs/                  # Documentation
├── tests/                 # Test files
└── DEPLOYMENT_GUIDE.md   # Deployment instructions
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