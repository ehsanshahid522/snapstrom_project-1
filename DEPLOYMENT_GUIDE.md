# 🚀 Automatic Deployment Setup Guide

This guide will help you set up automatic deployment for your SnapStream project using GitHub Actions and Vercel.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Vercel CLI**: Install with `npm i -g vercel`

## 🔧 Setup Steps

### 1. Initialize Vercel Projects

#### Frontend Project Setup:
```bash
cd frontend/client
vercel
```

#### Backend Project Setup:
```bash
vercel
```

### 2. Get Vercel Configuration

After initializing both projects, you'll need these values:

#### Frontend Project:
- **Project ID**: Found in Vercel dashboard
- **Org ID**: Found in Vercel dashboard

#### Backend Project:
- **Project ID**: Found in Vercel dashboard
- **Org ID**: Same as frontend

### 3. Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel API token | `vercel_xxxxx` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_xxxxx` |
| `VERCEL_PROJECT_ID` | Frontend project ID | `prj_xxxxx` |
| `VERCEL_BACKEND_PROJECT_ID` | Backend project ID | `prj_xxxxx` |
| `VITE_API_URL` | Backend API URL | `https://your-backend.vercel.app` |

### 4. Get Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token
3. Copy the token value
4. Add it to GitHub secrets as `VERCEL_TOKEN`

### 5. Get Project IDs

1. Go to your Vercel dashboard
2. Select each project
3. Go to Settings → General
4. Copy the Project ID
5. Add to GitHub secrets

## 🔄 How It Works

### Automatic Triggers:
- **Push to main/master**: Triggers full deployment
- **Pull Request**: Runs tests and builds (no deployment)
- **Path-specific changes**: Only deploys relevant parts

### Workflow Files:
- `frontend-deploy.yml`: Deploys frontend changes
- `backend-deploy.yml`: Deploys backend changes  
- `full-deploy.yml`: Full-stack deployment with testing

## 🚀 Deployment Process

1. **Push your code** to GitHub
2. **GitHub Actions** automatically:
   - Installs dependencies
   - Runs tests
   - Builds the frontend
   - Deploys to Vercel
3. **Vercel** handles the hosting and CDN

## 🔍 Monitoring

- **GitHub Actions**: Check the Actions tab in your repository
- **Vercel Dashboard**: Monitor deployments and performance
- **Build Logs**: Available in both GitHub Actions and Vercel

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**: Check the Actions logs for error details
2. **Missing Secrets**: Ensure all required secrets are set
3. **Environment Variables**: Verify `VITE_API_URL` is correct
4. **Dependencies**: Make sure `package.json` files are correct

### Debug Commands:
```bash
# Test locally
npm run build
cd frontend/client && npm run build

# Check Vercel status
vercel ls
vercel logs
```

## 📝 Environment Variables

Make sure these are set in Vercel:

### Backend Environment Variables:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: `production`

### Frontend Environment Variables:
- `VITE_API_URL`: Your backend API URL

## 🎉 Success!

Once set up, every push to your main branch will automatically:
1. ✅ Run tests
2. ✅ Build the frontend
3. ✅ Deploy to Vercel
4. ✅ Update your live application

Your app will be available at:
- **Frontend**: `https://your-frontend-project.vercel.app`
- **Backend**: `https://your-backend-project.vercel.app`
