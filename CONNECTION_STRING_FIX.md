# 🔧 CONNECTION STRING FIX - Password Encoding Issue

## **❌ Potential Issue:**
Your password contains `@` symbol which might need URL encoding.

## **🔧 Current Connection String:**
```
mongodb+srv://ehsanshahid97_db_user:Ehsan@397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0
```

## **✅ Try These Encoded Versions:**

### **Option 1: URL Encode @ symbol**
```
mongodb+srv://ehsanshahid97_db_user:Ehsan%40397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0
```

### **Option 2: Use different password**
If the above doesn't work, change your MongoDB Atlas password to something without special characters:
1. Go to MongoDB Atlas → Database Access
2. Edit your user
3. Change password to: `Ehsan397` (without @ symbol)
4. Use this connection string:
```
mongodb+srv://ehsanshahid97_db_user:Ehsan397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0
```

## **📋 Complete Environment Variables Setup:**

### **Step 1: Update MONGO_URI in Vercel**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update MONGO_URI with the encoded version:
```
Name: MONGO_URI
Value: mongodb+srv://ehsanshahid97_db_user:Ehsan%40397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0
Environment: Production
```

### **Step 2: Add Missing Variables**
```
Name: JWT_SECRET
Value: snapstream-super-secret-jwt-key-2024-change-this-later
Environment: Production
```

```
Name: NODE_ENV
Value: production
Environment: Production
```

### **Step 3: Redeploy**
1. Save all variables
2. Go to Deployments → Redeploy

## **🧪 Test After Fix:**

```bash
# Test environment variables
curl https://snapstrom-project-1.vercel.app/api/test/env

# Test database connection
curl https://snapstrom-project-1.vercel.app/api/test/db
```

## **📋 Expected Results:**

✅ **Environment test:**
```json
{
  "hasMongoUri": true,
  "hasJwtSecret": true,
  "nodeEnv": "production"
}
```

✅ **Database test:**
```json
{
  "connected": true,
  "readyState": "connected"
}
```

---

**Try the URL-encoded version first. If that doesn't work, change your MongoDB password to remove the @ symbol.** 🚀
