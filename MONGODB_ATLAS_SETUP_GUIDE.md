# 🔧 MongoDB Atlas Setup Guide

## 🚨 **Database Connection Issue**

Your MongoDB connection is failing. This guide will help you set up MongoDB Atlas correctly to fix the connection issue.

## 📋 **Step-by-Step MongoDB Atlas Setup**

### **Step 1: Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign up for a free account
3. Create a new project

### **Step 2: Create a Cluster**
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your location
5. Click "Create"

### **Step 3: Set Up Database Access**
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set a username (e.g., `snapstream_user`)
5. Set a strong password (save this!)
6. Select "Read and write to any database" role
7. Click "Add User"

### **Step 4: Set Up Network Access**
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. This adds `0.0.0.0/0` to the IP access list
5. Click "Confirm"

### **Step 5: Get Your Connection String**
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Select "Node.js" and version "5.0 or later"
5. Copy the connection string

### **Step 6: Format Your Connection String**
Replace the placeholder values in your connection string:

```
mongodb+srv://snapstream_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/snapstream?retryWrites=true&w=majority
```

**Important:**
- Replace `snapstream_user` with your actual username
- Replace `YOUR_PASSWORD` with your actual password
- Replace `cluster0.xxxxx.mongodb.net` with your actual cluster URL
- Add `/snapstream` before the `?` to specify the database name

### **Step 7: Set Environment Variables in Vercel**
1. Go to your Vercel project dashboard
2. Go to "Settings" → "Environment Variables"
3. Add these variables:

```
MONGO_URI=mongodb+srv://snapstream_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/snapstream?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=production
```

## 🔍 **Testing Your Connection**

### **Test 1: Check Environment Variables**
Visit: `https://snapstrom-project-1.vercel.app/api/test/env`

**Expected Results:**
```json
{
  "hasMongoUri": true,
  "mongoUriLength": 133,
  "mongoUriStartsWithSrv": true,
  "mongoUriContainsNet": true,
  "mongoUriHasUsername": true,
  "mongoUriHasDatabase": true
}
```

### **Test 2: Check Database Connection**
Visit: `https://snapstrom-project-1.vercel.app/api/test/db`

**Expected Results:**
```json
{
  "connected": true,
  "readyState": "connected",
  "connectionAttempted": true
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Authentication failed"**
**Solution:**
- Check username and password in connection string
- Ensure user has "Read and write to any database" role
- Verify user is active in Database Access

### **Issue 2: "Network timeout"**
**Solution:**
- Add `0.0.0.0/0` to Network Access
- Check if cluster is active (not paused)
- Try a different region

### **Issue 3: "Invalid connection string"**
**Solution:**
- Ensure format: `mongodb+srv://username:password@cluster.mongodb.net/database`
- Check for special characters in password (use %40 for @)
- Verify cluster URL is correct

### **Issue 4: "Cluster not found"**
**Solution:**
- Check if cluster is active in MongoDB Atlas
- Verify cluster URL in connection string
- Ensure cluster is in the same project

## 🔧 **Connection String Examples**

### **Correct Format:**
```
mongodb+srv://snapstream_user:mypassword123@cluster0.abc123.mongodb.net/snapstream?retryWrites=true&w=majority
```

### **With Special Characters in Password:**
If your password contains `@`, replace it with `%40`:
```
mongodb+srv://snapstream_user:mypass%40word123@cluster0.abc123.mongodb.net/snapstream?retryWrites=true&w=majority
```

## 📊 **Verification Checklist**

- [ ] MongoDB Atlas account created
- [ ] Free cluster created and active
- [ ] Database user created with proper permissions
- [ ] Network access allows all IPs (`0.0.0.0/0`)
- [ ] Connection string formatted correctly
- [ ] Environment variables set in Vercel
- [ ] `/api/test/env` shows all checks as `true`
- [ ] `/api/test/db` shows `connected: true`

## 🎯 **Expected Results After Setup**

1. **Environment Test**: All MongoDB URI checks should be `true`
2. **Database Test**: Should show `connected: true`
3. **Registration**: Should return 201 status instead of 500
4. **Login**: Should work after successful registration

## 🆘 **If Still Not Working**

1. **Check Vercel Logs**: Look for detailed error messages
2. **Verify MongoDB Atlas**: Ensure cluster is active and accessible
3. **Test Connection String**: Try connecting locally with `mongosh`
4. **Check Network**: Ensure no firewall blocking MongoDB Atlas

## 📞 **Next Steps**

1. **Follow the setup guide above**
2. **Set environment variables in Vercel**
3. **Wait for deployment**
4. **Test the endpoints**
5. **Try registration again**

---

**Status**: 🔧 Setup guide created  
**Last Updated**: 2024-01-01  
**Version**: 1.0.0
