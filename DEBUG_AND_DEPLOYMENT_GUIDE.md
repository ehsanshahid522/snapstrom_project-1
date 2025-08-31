# 🔧 SnapStream Debug & Deployment Guide

## 🚨 **Current Issue: 500 Error on Login**

### **Root Cause Analysis:**
1. **API Server Import Issues**: Fixed by adding inline schemas
2. **Frontend API URL Configuration**: Fixed with proper config
3. **Database Connection**: Potential MongoDB connection issues
4. **Environment Variables**: Missing or incorrect configuration

## ✅ **Fixes Applied:**

### **1. API Server (`api/server.js`)**
- ✅ Added inline User and File schemas to avoid import path issues
- ✅ Fixed login route with proper error handling
- ✅ Fixed upload route field mapping
- ✅ Added proper CORS configuration
- ✅ Enhanced error handling and logging

### **2. Frontend Configuration (`frontend/client/src/config.js`)**
- ✅ Created centralized configuration
- ✅ Added proper API URL fallback logic
- ✅ Added environment detection helpers

### **3. API Library (`frontend/client/src/lib/api.js`)**
- ✅ Updated to use centralized configuration
- ✅ Improved error handling
- ✅ Better JSON parsing

## 🔧 **Environment Setup:**

### **Backend Environment Variables (Vercel)**
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/snapstream?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
NODE_ENV=production
```

### **Frontend Environment Variables (Vercel)**
```bash
VITE_API_URL=https://snapstream-backend.vercel.app
NODE_ENV=production
```

## 🧪 **Testing Steps:**

### **1. Test Backend Health**
```bash
curl https://snapstream-backend.vercel.app/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "mongodb": "connected",
  "hasMongoUri": true,
  "hasJwtSecret": true
}
```

### **2. Test API Endpoints**
```bash
# Test ping
curl https://snapstream-backend.vercel.app/api/test/ping

# Test environment
curl https://snapstream-backend.vercel.app/api/test/env

# Test database
curl https://snapstream-backend.vercel.app/api/test/db
```

### **3. Test Login Endpoint**
```bash
curl -X POST https://snapstream-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🚀 **Deployment Checklist:**

### **Backend Deployment (Vercel)**
1. ✅ Ensure `api/server.js` is properly configured
2. ✅ Set environment variables in Vercel dashboard
3. ✅ Verify MongoDB Atlas connection
4. ✅ Test all endpoints after deployment

### **Frontend Deployment (Vercel)**
1. ✅ Set `VITE_API_URL` environment variable
2. ✅ Build and deploy frontend
3. ✅ Test login functionality
4. ✅ Verify API communication

## 🔍 **Debugging Commands:**

### **Check Vercel Function Logs**
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Check for errors in function logs

### **Test Database Connection**
```bash
# Test MongoDB connection string
mongosh "mongodb+srv://username:password@cluster.mongodb.net/snapstream"
```

### **Check Environment Variables**
```bash
curl https://snapstream-backend.vercel.app/api/test/env
```

## 🛠️ **Common Issues & Solutions:**

### **Issue: "Database not configured"**
**Solution:**
1. Check `MONGO_URI` environment variable in Vercel
2. Verify MongoDB Atlas connection string
3. Ensure IP whitelist includes `0.0.0.0/0`

### **Issue: "CORS errors"**
**Solution:**
1. Check browser console for specific CORS errors
2. Verify frontend URL is in allowed origins
3. Check if API calls are using correct URLs

### **Issue: "Login error"**
**Solution:**
1. Check if user exists in database
2. Verify password hashing is working
3. Check JWT_SECRET environment variable
4. Test login endpoint directly

### **Issue: "500 Internal Server Error"**
**Solution:**
1. Check Vercel function logs
2. Verify all imports are working
3. Check environment variables
4. Test database connection

## 📊 **Monitoring:**

### **Vercel Dashboard**
- Monitor function execution times
- Check for cold start issues
- Monitor error rates
- Check function logs

### **MongoDB Atlas**
- Monitor connection count
- Check query performance
- Look for slow queries
- Monitor database size

## 🎯 **Next Steps:**

1. **Deploy Backend**: Push changes to trigger Vercel deployment
2. **Deploy Frontend**: Push changes to trigger frontend deployment
3. **Test Endpoints**: Verify all API endpoints are working
4. **Test Login**: Create a test user and verify login
5. **Monitor Logs**: Check for any remaining errors

## 📝 **Notes:**

- The API server now uses inline schemas to avoid import path issues
- Frontend configuration is centralized for better maintainability
- Error handling has been improved throughout the application
- CORS is configured to allow all origins for development
- Database connection includes automatic URL encoding fixes

---

**Status**: ✅ Ready for deployment
**Last Updated**: 2024-01-01
**Version**: 1.0.0
