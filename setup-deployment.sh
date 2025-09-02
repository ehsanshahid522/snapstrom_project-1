#!/bin/bash

echo "🚀 SnapStream Automatic Deployment Setup"
echo "========================================"
echo ""

echo "📋 Prerequisites Check:"
echo "✅ GitHub repository connected"
echo "✅ Code pushed to GitHub"
echo ""

echo "🔧 Next Steps:"
echo ""

echo "1. 📝 Set up Vercel Projects:"
echo "   - Go to https://vercel.com"
echo "   - Sign up/login with your GitHub account"
echo "   - Create two new projects:"
echo "     * Frontend: Import from GitHub (frontend/client)"
echo "     * Backend: Import from GitHub (root directory)"
echo ""

echo "2. 🔑 Get Vercel Token:"
echo "   - Go to https://vercel.com/account/tokens"
echo "   - Create a new token"
echo "   - Copy the token value"
echo ""

echo "3. 📊 Get Project IDs:"
echo "   - In each Vercel project dashboard"
echo "   - Go to Settings → General"
echo "   - Copy the Project ID"
echo ""

echo "4. 🔐 Add GitHub Secrets:"
echo "   - Go to your GitHub repository"
echo "   - Settings → Secrets and variables → Actions"
echo "   - Add these secrets:"
echo "     * VERCEL_TOKEN (your Vercel token)"
echo "     * VERCEL_ORG_ID (your org ID)"
echo "     * VERCEL_PROJECT_ID (frontend project ID)"
echo "     * VERCEL_BACKEND_PROJECT_ID (backend project ID)"
echo "     * VITE_API_URL (your backend URL)"
echo ""

echo "5. 🎉 Test Deployment:"
echo "   - Make a small change to your code"
echo "   - Push to GitHub"
echo "   - Check the Actions tab for deployment status"
echo ""

echo "📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""

echo "🎯 Your repository: https://github.com/ehsanshahid522/snapstrom_project-1"
echo "🔗 GitHub Actions: https://github.com/ehsanshahid522/snapstrom_project-1/actions"
echo ""
