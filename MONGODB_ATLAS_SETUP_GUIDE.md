# 🗄️ MongoDB Atlas Setup Guide

## 🚨 **Current Issue: Database Connection Failed**

Based on the test results, your MongoDB Atlas connection is failing. The main issues are:
1. **Network Access**: Vercel can't reach MongoDB Atlas
2. **Password Encoding**: `@` symbol in password needs URL encoding

Here's how to fix it:

## 🔍 **Diagnosis Results:**
- ✅ **Environment Variables**: `MONGO_URI` is set correctly
- ✅ **Connection String Format**: Valid `mongodb+srv://` format
- ❌ **Network Access**: Vercel can't reach MongoDB Atlas
- ❌ **Password Encoding**: `@` symbol in password needs URL encoding

## 🛠️ **Step-by-Step Fix:**

### **Step 1: Fix Network Access**

1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com
   - Sign in to your account
   - Select your project

2. **Navigate to Network Access**
   - Click on "Network Access" in the left sidebar
   - Click "Add IP Address"

3. **Allow All IPs (Recommended for Vercel)**
   - Click "Allow Access from Anywhere"
   - This adds `0.0.0.0/0` to your IP access list
   - Click "Confirm"

4. **Alternative: Add Vercel IPs**
   - If you prefer to be more restrictive, add these IP ranges:
   - `76.76.19.0/24`
   - `76.76.20.0/24`
   - `76.76.21.0/24`
   - `76.76.22.0/24`

### **Step 2: Verify Database User**

1. **Go to Database Access**
   - Click on "Database Access" in the left sidebar
   - Find your database user

2. **Check User Permissions**
   - Ensure the user has "Read and write to any database" role
   - If not, click "Edit" and add this role

3. **Verify User Status**
   - Make sure the user is "Active"
   - If not, click "Edit" and activate the user

### **Step 3: Check Cluster Status**

1. **Go to Clusters**
   - Click on "Clusters" in the left sidebar
   - Check if your cluster is "Active" (not paused)

2. **Cluster Health**
   - Look for any warning indicators
   - Ensure the cluster is running properly

### **Step 4: Fix Password Encoding**

If your password contains special characters (especially `@`), you need to URL-encode them:

1. **Common Special Characters:**
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `$` becomes `%24`
   - `%` becomes `%25`
   - `&` becomes `%26`
   - `+` becomes `%2B`
   - `/` becomes `%2F`
   - `:` becomes `%3A`
   - `=` becomes `%3D`
   - `?` becomes `%3F`

2. **Example:**
   ```
   Original: mypass@word
   Encoded: mypass%40word
   ```

3. **Update Vercel Environment Variable:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Find `MONGO_URI`
   - Update the password part with URL-encoded characters
   - Click "Save"

### **Step 5: Test the Fix**

1. **Wait for Changes to Apply**
   - MongoDB Atlas changes take a few minutes to apply
   - Vercel will auto-deploy when you update environment variables

2. **Test Database Connection**
   ```bash
   curl https://snapstrom-project-1.vercel.app/api/test/db
   ```

3. **Expected Result:**
   ```json
   {
     "connected": true,
     "readyState": 1,
     "connectionAttempted": true,
     "connectionResult": true,
     "timestamp": "2024-01-01T...",
     "hasMongoUri": true,
     "mongoUriLength": 125
   }
   ```

## 🔧 **Troubleshooting Common Issues:**

### **Issue 1: Still Getting Connection Errors**
- **Check Vercel Logs**: Go to Vercel Dashboard → Functions → View Function Logs
- **Look for**: `MongoServerSelectionError`, `MongoNetworkError`, `Authentication failed`

### **Issue 2: Authentication Failed**
- **Check**: Username and password are correct
- **Check**: Password is properly URL-encoded
- **Check**: User has proper permissions

### **Issue 3: Network Access Denied**
- **Check**: IP access list includes `0.0.0.0/0`
- **Check**: Network access changes have been applied (wait 5-10 minutes)

### **Issue 4: Cluster Not Found**
- **Check**: Connection string has correct cluster name
- **Check**: Cluster is active and not paused

## 📊 **Verification Checklist:**

- [ ] Network Access allows `0.0.0.0/0`
- [ ] Database user has "Read and write to any database" role
- [ ] Database user is active
- [ ] Cluster is active (not paused)
- [ ] Password is properly URL-encoded
- [ ] Connection string format is correct
- [ ] Vercel environment variable is updated
- [ ] Test endpoint returns `connected: true`

## 🎯 **Success Indicators:**

✅ **Database Test Passes:**
```bash
curl https://snapstrom-project-1.vercel.app/api/test/db
# Returns: {"connected":true,"readyState":1,...}
```

✅ **Login Works:**
- No more "Database connection failed" errors
- Login returns 200 status with JWT token

✅ **Vercel Logs Show Success:**
- `✅ MongoDB connected successfully`
- `✅ MongoDB ping successful`

## 🆘 **If Still Not Working:**

1. **Check Vercel Function Logs** for detailed error messages
2. **Verify MongoDB Atlas Settings** using the checklist above
3. **Test Connection String** locally with the provided test script
4. **Contact Support** if the issue persists

---

**Status**: 🔧 Setup guide updated for current issue  
**Last Updated**: 2024-01-01  
**Version**: 2.0.0
