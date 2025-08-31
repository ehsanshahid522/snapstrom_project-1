# 🗄️ DATABASE SETUP GUIDE - Fix "Database not configured" Error

## **❌ The Problem:**
You're getting a 500 error: `Error: Database not configured`

This means the `MONGO_URI` environment variable is not set in Vercel.

## **✅ The Solution:**
You need to set up MongoDB Atlas and configure environment variables in Vercel.

## **📋 Step-by-Step Setup:**

### **Step 1: Create MongoDB Atlas Database**

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Sign up/Login** to your account
3. **Create a new cluster**:
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select your preferred cloud provider & region
   - Click "Create"

### **Step 2: Set Up Database Access**

1. **Create Database User**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Username: `snapstream_user`
   - Password: `your_secure_password_here`
   - Role: "Read and write to any database"
   - Click "Add User"

### **Step 3: Set Up Network Access**

1. **Allow All IPs** (for development):
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

### **Step 4: Get Your Connection String**

1. **Get Connection String**:
   - Go to "Database" in the left sidebar
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

2. **Format Your Connection String**:
   ```
   mongodb+srv://snapstream_user:your_secure_password_here@cluster0.xxxxx.mongodb.net/snapstream?retryWrites=true&w=majority
   ```

### **Step 5: Set Environment Variables in Vercel**

1. **Go to Vercel Dashboard**:
   - Visit https://vercel.com/dashboard
   - Find your project (snapstrom-project-1)
   - Click on it

2. **Go to Settings**:
   - Click "Settings" tab
   - Click "Environment Variables" in the left sidebar

3. **Add Environment Variables**:
   ```
   Name: MONGO_URI
   Value: mongodb+srv://snapstream_user:your_secure_password_here@cluster0.xxxxx.mongodb.net/snapstream?retryWrites=true&w=majority
   Environment: Production
   ```

   ```
   Name: JWT_SECRET
   Value: your-super-secret-jwt-key-here-change-this-in-production
   Environment: Production
   ```

   ```
   Name: NODE_ENV
   Value: production
   Environment: Production
   ```

4. **Save and Redeploy**:
   - Click "Save" for each variable
   - Go to "Deployments" tab
   - Click "Redeploy" on your latest deployment

## **🔍 Test Your Database Connection:**

After setting up the environment variables, test these endpoints:

### **1. Health Check**
```bash
curl https://snapstrom-project-1.vercel.app/health
```

### **2. Database Test**
```bash
curl https://snapstrom-project-1.vercel.app/api/test/db
```

### **3. Environment Test**
```bash
curl https://snapstrom-project-1.vercel.app/api/test/env
```

## **📋 Expected Results:**

✅ **Health check should return:**
```json
{
  "status": "ok",
  "mongodb": "connected",
  "hasMongoUri": true,
  "hasJwtSecret": true
}
```

✅ **Database test should return:**
```json
{
  "connected": true,
  "readyState": "connected"
}
```

✅ **Environment test should return:**
```json
{
  "hasMongoUri": true,
  "hasJwtSecret": true,
  "nodeEnv": "production"
}
```

## **🚨 Troubleshooting:**

### **If Still Getting "Database not configured":**
1. **Check Vercel Environment Variables**:
   - Go to Vercel dashboard → Settings → Environment Variables
   - Make sure `MONGO_URI` is set correctly
   - Make sure it's set for "Production" environment

2. **Check MongoDB Atlas**:
   - Verify your database user exists
   - Verify IP whitelist includes 0.0.0.0/0
   - Test connection string in MongoDB Compass

3. **Redeploy Your App**:
   - After setting environment variables, redeploy your app
   - Go to Deployments → Redeploy

### **If Connection String Issues:**
1. **Check Password**: Make sure there are no special characters in the password
2. **Check Username**: Make sure the username matches exactly
3. **Check Cluster Name**: Make sure the cluster name in the URL is correct

## **🎯 What Should Work After Setup:**

✅ **Registration** - `POST /api/auth/register`
✅ **Login** - `POST /api/auth/login`
✅ **Upload** - `POST /api/upload`
✅ **Database Connection** - All endpoints working

## **📱 Test Your App:**

1. Visit your app: `https://snapstrom-project-1.vercel.app`
2. Try to register a new account
3. Try to login
4. Try to upload an image
5. Check browser console - no more database errors!

---

**Follow these steps exactly and your database will work!** 🚀

**The key is setting the `MONGO_URI` environment variable in Vercel.**
