# Snapstream Deployment Guide

This guide will help you deploy Snapstream to Vercel successfully.

## Prerequisites

1. **MongoDB Atlas Account**: You'll need a MongoDB Atlas cluster
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Account**: For version control

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier is fine)
3. Create a database user with read/write permissions
4. Get your connection string
5. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

## Step 2: Deploy Backend

1. **Create a new Vercel project**:
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Set the root directory to `backend`

2. **Configure Environment Variables**:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/snapstream?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
   NODE_ENV=production
   ```

3. **Deploy**:
   - Vercel will automatically detect the Node.js project
   - The build command should be: `npm install`
   - The output directory should be: `./` (not needed for API)
   - Deploy the project

4. **Get your backend URL**:
   - After deployment, copy the URL (e.g., `https://snapstream-backend.vercel.app`)

## Step 3: Deploy Frontend

1. **Create another Vercel project**:
   - Go to Vercel dashboard
   - Click "New Project"
   - Import the same GitHub repository
   - Set the root directory to `frontend`

2. **Configure Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```

3. **Deploy**:
   - Vercel will automatically detect the Vite project
   - The build command should be: `cd client && npm install && npm run build`
   - The output directory should be: `client/dist`
   - Deploy the project

## Step 4: Test Your Deployment

1. **Test Backend Health**:
   - Visit `https://your-backend-url.vercel.app/health`
   - Should return: `{"status":"ok","timestamp":"...","environment":"production"}`

2. **Test Frontend**:
   - Visit your frontend URL
   - Try to register/login
   - Try to upload an image
   - Check if images are displayed correctly

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Make sure your backend CORS settings include your frontend URL
   - Check the `origin` array in `backend/server/server.js`

2. **MongoDB Connection Issues**:
   - Verify your MongoDB URI is correct
   - Make sure your IP is whitelisted in MongoDB Atlas
   - Check if your database user has the right permissions

3. **Image Upload Issues**:
   - Vercel has limitations on file uploads
   - Consider using a cloud storage service like AWS S3 or Cloudinary
   - For now, the app uses local file storage (limited on Vercel)

4. **Environment Variables**:
   - Make sure all required environment variables are set
   - Check the spelling and format of your MongoDB URI

### File Storage Limitation:

Vercel's serverless functions have limitations for file storage. For production, consider:

1. **Cloudinary** (Recommended):
   - Free tier available
   - Easy integration
   - Automatic image optimization

2. **AWS S3**:
   - More control
   - Pay per use
   - Requires AWS account

3. **Firebase Storage**:
   - Google's solution
   - Good free tier
   - Easy integration

## Security Checklist

- [ ] Change the default JWT_SECRET
- [ ] Use HTTPS URLs only
- [ ] Set up proper CORS origins
- [ ] Validate file uploads
- [ ] Implement rate limiting (optional)
- [ ] Set up monitoring (optional)

## Performance Optimization

1. **Image Optimization**:
   - Use WebP format
   - Implement lazy loading
   - Add proper caching headers

2. **Database Optimization**:
   - Add proper indexes
   - Use pagination
   - Implement caching

3. **Frontend Optimization**:
   - Enable gzip compression
   - Use CDN for static assets
   - Implement code splitting

## Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Verify your environment variables
3. Test your MongoDB connection
4. Check the browser console for errors
5. Verify your API endpoints are working

## Next Steps

After successful deployment:

1. Set up a custom domain
2. Configure monitoring
3. Set up automated backups
4. Implement analytics
5. Add more features
