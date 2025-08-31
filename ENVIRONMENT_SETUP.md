# 🔧 ENVIRONMENT SETUP - Fix Database Connection Issues

## **❌ Current Issues Identified:**

1. **MONGO_URI is set** ✅ (`"hasMongoUri": true`)
2. **JWT_SECRET is missing** ❌ (`"hasJwtSecret": false`)
3. **Database is disconnected** ❌ (`"connected": false`)
4. **API endpoints not responding properly** ❌

## **✅ Required Environment Variables:**

You need to set **ALL THREE** environment variables in Vercel:

### **Variable 1: MONGO_URI** ✅ (Already Set)
```
Name: MONGO_URI
Value: mongodb+srv://ehsanshahid97_db_user:Ehsan@397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0
Environment: Production
```

### **Variable 2: JWT_SECRET** ❌ (Missing - Need to Add)
```
Name: JWT_SECRET
Value: snapstream-super-secret-jwt-key-2024-change-this-later
Environment: Production
```

### **Variable 3: NODE_ENV** ❌ (Missing - Need to Add)
```
Name: NODE_ENV
Value: production
Environment: Production
```

## **📋 Step-by-Step Fix:**

### **Step 1: Add Missing Environment Variables**
1. Go to: https://vercel.com/dashboard
2. Find project: `snapstrom-project-1`
3. Click "Settings" → "Environment Variables"
4. **Add JWT_SECRET:**
   ```
   Name: JWT_SECRET
   Value: snapstream-super-secret-jwt-key-2024-change-this-later
   Environment: Production
   ```
5. **Add NODE_ENV:**
   ```
   Name: NODE_ENV
   Value: production
   Environment: Production
   ```

### **Step 2: Redeploy Your App**
1. Go to "Deployments" tab
2. Click "Redeploy" on your latest deployment
3. Wait for deployment to complete

### **Step 3: Test Database Connection**
After redeployment, test these endpoints:

```bash
# Test environment variables
curl https://snapstrom-project-1.vercel.app/api/test/env

# Test database connection
curl https://snapstrom-project-1.vercel.app/api/test/db

# Test API ping
curl https://snapstrom-project-1.vercel.app/api/test/ping
```

## **📋 Expected Results After Fix:**

✅ **Environment test should return:**
```json
{
  "hasMongoUri": true,
  "hasJwtSecret": true,
  "nodeEnv": "production"
}
```

✅ **Database test should return:**
```json
{
  "connected": true,
  "readyState": "connected"
}
```

✅ **API ping should return:**
```json
{
  "message": "API is working!",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production"
}
```

## **🚨 If Database Still Disconnected:**

### **Check MongoDB Atlas:**
1. Go to: https://cloud.mongodb.com
2. Check your cluster status
3. Verify network access allows all IPs (0.0.0.0/0)
4. Verify database user exists and has correct permissions

### **Test Connection String:**
1. Use MongoDB Compass to test the connection string
2. Make sure the password doesn't have special characters that need encoding

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
5. Check browser console - no more errors!

---

**The key issue is that JWT_SECRET and NODE_ENV are missing from your environment variables.** 🚀

**Add them in Vercel and redeploy your app!**
