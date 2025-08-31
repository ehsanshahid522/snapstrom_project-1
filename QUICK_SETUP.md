# 🚀 QUICK SETUP - Your MongoDB Connection String

## **✅ Your Connection String:**
```
mongodb+srv://ehsanshahid97_db_user:Ehsan@397@cluster0.a9c2ktd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

## **🔧 Format for Vercel:**
You need to add the database name. Use this exact string:

```
mongodb+srv://ehsanshahid97_db_user:Ehsan@397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0
```

**Note:** I added `/snapstream` after `.net/` to specify the database name.

## **📋 Step-by-Step Setup:**

### **Step 1: Go to Vercel Dashboard**
1. Visit: https://vercel.com/dashboard
2. Find your project: `snapstrom-project-1`
3. Click on it

### **Step 2: Set Environment Variables**
1. Click "Settings" tab
2. Click "Environment Variables" in left sidebar
3. Add these variables:

**Variable 1:**
```
Name: MONGO_URI
Value: mongodb+srv://ehsanshahid97_db_user:Ehsan@397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0
Environment: Production
```

**Variable 2:**
```
Name: JWT_SECRET
Value: snapstream-super-secret-jwt-key-2024-change-this-later
Environment: Production
```

**Variable 3:**
```
Name: NODE_ENV
Value: production
Environment: Production
```

### **Step 3: Save and Redeploy**
1. Click "Save" for each variable
2. Go to "Deployments" tab
3. Click "Redeploy" on your latest deployment

## **🧪 Test After Setup:**

```bash
# Test database connection
curl https://snapstrom-project-1.vercel.app/api/test/db

# Test environment variables
curl https://snapstrom-project-1.vercel.app/api/test/env

# Test health check
curl https://snapstrom-project-1.vercel.app/health
```

## **📋 Expected Results:**

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

## **🎯 What Will Work After Setup:**

✅ **Registration** - `POST /api/auth/register`
✅ **Login** - `POST /api/auth/login`
✅ **Upload** - `POST /api/upload`
✅ **All database operations**

## **📱 Test Your App:**

1. Visit: `https://snapstrom-project-1.vercel.app`
2. Try to register a new account
3. Try to login
4. Try to upload an image
5. Check browser console - no more database errors!

---

**Follow these steps exactly and your app will work perfectly!** 🚀

**The key is setting the environment variables in Vercel with your MongoDB connection string.**
