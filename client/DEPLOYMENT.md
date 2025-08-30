# Vercel Deployment Guide for SnapStream

## Prerequisites
- Your backend server must be deployed and accessible via HTTPS
- You need a Vercel account

## Deployment Steps

### 1. Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Set the root directory to `client/`
3. Build command: `npm run build`
4. Output directory: `dist`

### 2. Environment Variables
Set these environment variables in Vercel:

```
VITE_API_URL=https://your-backend-domain.com
```

**Important:** Replace `https://your-backend-domain.com` with your actual backend URL.

### 3. Build Settings
- Framework Preset: Vite
- Node.js Version: 18.x or higher

### 4. Common Issues & Solutions

#### Build Error: "terser not found"
- ✅ **Fixed**: Updated vite.config.js to use default minifier

#### API Connection Issues
- ✅ **Fixed**: Updated API configuration to use environment variables
- Make sure `VITE_API_URL` is set correctly in Vercel

#### Routing Issues
- ✅ **Fixed**: Added vercel.json with proper SPA routing

### 5. File Structure
```
client/
├── vercel.json          # Vercel configuration
├── vite.config.js       # Build configuration
├── env.example          # Environment variables template
└── src/
    └── lib/
        └── api.js       # API configuration
```

### 6. Testing Deployment
After deployment, test these features:
- [ ] User registration/login
- [ ] Feed loading
- [ ] Image uploads
- [ ] Profile viewing
- [ ] Navigation between pages

### 7. Backend Requirements
Ensure your backend:
- Has CORS configured for your Vercel domain
- Is accessible via HTTPS
- Has all required environment variables set

## Support
If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Ensure backend is accessible
4. Check browser console for errors
