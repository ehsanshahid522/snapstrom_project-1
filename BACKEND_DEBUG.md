# 🔧 Backend Debugging Guide

## **Issues Fixed:**

### ✅ **1. CORS Configuration**
- **Problem**: Hardcoded origins causing CORS errors
- **Solution**: Dynamic CORS with fallback to allow all origins
- **Result**: Better cross-origin request handling

### ✅ **2. Database Connection**
- **Problem**: Connection issues in serverless environment
- **Solution**: Optimized connection pooling and error handling
- **Result**: More stable database connections

### ✅ **3. Vercel Configuration**
- **Problem**: Inefficient build and routing setup
- **Solution**: Proper version 2 configuration with separate builds
- **Result**: Better performance and reliability

### ✅ **4. Serverless Optimization**
- **Problem**: Not optimized for Vercel's serverless functions
- **Solution**: Added proper exports and connection management
- **Result**: Better cold start performance

## **🔍 How to Test Your Backend:**

### **1. Health Check**
```bash
curl https://your-app.vercel.app/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "mongodb": "connected",
  "uptime": 123.45,
  "memory": {...},
  "version": "v18.x.x"
}
```

### **2. API Ping Test**
```bash
curl https://your-app.vercel.app/api/test/ping
```
**Expected Response:**
```json
{
  "message": "API is working!",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "database": "connected"
}
```

### **3. Environment Variables Test**
```bash
curl https://your-app.vercel.app/api/test/env
```
**Expected Response:**
```json
{
  "nodeEnv": "production",
  "hasMongoUri": true,
  "hasJwtSecret": true,
  "port": "3000",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### **4. Database Connection Test**
```bash
curl https://your-app.vercel.app/api/test/db
```
**Expected Response:**
```json
{
  "connected": true,
  "readyState": "connected",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## **🚨 Common Issues & Solutions:**

### **Issue: "Database disconnected"**
**Solution:**
1. Check MongoDB Atlas connection string
2. Verify IP whitelist includes `0.0.0.0/0`
3. Check if database user has proper permissions

### **Issue: "CORS errors"**
**Solution:**
1. Check browser console for specific CORS errors
2. Verify frontend URL is in allowed origins
3. Check if API calls are using correct URLs

### **Issue: "Slow response times"**
**Solution:**
1. Check Vercel function logs
2. Monitor database connection pool
3. Consider using connection pooling

### **Issue: "Function timeout"**
**Solution:**
1. Check function duration in Vercel dashboard
2. Optimize database queries
3. Consider breaking large operations

## **📊 Performance Monitoring:**

### **Vercel Dashboard:**
1. Go to your Vercel project
2. Check "Functions" tab
3. Monitor response times and errors
4. Check "Analytics" for usage patterns

### **Database Monitoring:**
1. Check MongoDB Atlas dashboard
2. Monitor connection count
3. Check query performance
4. Look for slow queries

## **🔧 Environment Variables Checklist:**

Make sure these are set in Vercel:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/snapstream?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
NODE_ENV=production
```

## **📈 Optimization Tips:**

### **1. Database Optimization:**
- Use indexes on frequently queried fields
- Implement pagination for large datasets
- Use lean queries when possible
- Consider caching for static data

### **2. API Optimization:**
- Implement request rate limiting
- Use compression for large responses
- Optimize image uploads
- Implement proper error handling

### **3. Vercel Optimization:**
- Keep functions lightweight
- Use edge caching where possible
- Optimize bundle size
- Monitor cold start times

## **🆘 Still Having Issues?**

### **1. Check Vercel Logs:**
- Go to Vercel dashboard
- Check "Functions" tab
- Look for error logs
- Monitor function execution times

### **2. Test Locally:**
```bash
cd backend
npm install
npm start
```
Then test: `curl http://localhost:3000/health`

### **3. Check Database:**
- Verify MongoDB Atlas is accessible
- Test connection string
- Check user permissions
- Monitor connection limits

### **4. Browser Debugging:**
- Open browser developer tools
- Check Network tab for API calls
- Look for CORS errors
- Check Console for JavaScript errors

---

**Your backend should now be much more efficient!** 🚀

**Test the endpoints above to verify everything is working correctly.**
