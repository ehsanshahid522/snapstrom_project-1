# 🚀 Snapstream Deployment Guide

## **CRITICAL: Environment Variables Setup**

Before deploying, you MUST set these environment variables in Vercel:

### **Required Environment Variables:**

1. **MONGO_URI** - Your MongoDB connection string
2. **JWT_SECRET** - A secure random string for JWT tokens
3. **NODE_ENV** - Set to "production"

### **How to Set Environment Variables in Vercel:**

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Go to "Environment Variables" section
4. Add these variables:

```
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/snapstream?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
NODE_ENV=production
```

## **Deployment Steps:**

### **Step 1: Prepare Your Repository**
✅ Ensure all files are committed and pushed to GitHub
✅ Verify vercel.json is in the root directory
✅ Check that package.json has the correct scripts

### **Step 2: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. **IMPORTANT**: Set Root Directory to `/` (root)
5. Click "Deploy"

### **Step 3: Configure Environment Variables**
1. After initial deployment, go to project settings
2. Add the environment variables listed above
3. Redeploy the project

### **Step 4: Test Your Deployment**
1. Check the health endpoint: `https://your-app.vercel.app/health`
2. Test the frontend: `https://your-app.vercel.app`
3. Try to register/login
4. Test image upload functionality

## **Troubleshooting Common Issues:**

### **Error: "Function Runtimes must have a valid version"**
✅ **FIXED**: Removed conflicting vercel.json files and simplified configuration

### **Error: "Missing environment variables"**
✅ **SOLUTION**: Set MONGO_URI and JWT_SECRET in Vercel dashboard

### **Error: "Build failed"**
✅ **CHECK**: Ensure all dependencies are in package.json
✅ **CHECK**: Verify vercel-build script exists

### **Error: "MongoDB connection failed"**
✅ **CHECK**: Verify MONGO_URI is correct
✅ **CHECK**: Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0

## **Current Configuration Status:**

✅ **vercel.json** - Simplified and working
✅ **package.json** - Correct build scripts
✅ **Backend** - Properly configured
✅ **Frontend** - Build-ready
❌ **Environment Variables** - Need to be set in Vercel dashboard

## **Next Steps:**

1. **Set Environment Variables** in Vercel dashboard
2. **Redeploy** your project
3. **Test** all functionality
4. **Monitor** logs for any issues

## **Need Help?**

If you're still having issues:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test MongoDB connection string
4. Run local tests to isolate issues

---

**Your project is now properly configured for deployment!** 🎉
