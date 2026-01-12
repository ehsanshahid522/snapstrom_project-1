# SnapStream Deployment Guide

Automated deployment via GitHub Actions requires sensitive credentials (secrets). Since these are not currently set, your deployments are skipping the push to Vercel.

## 1. Get your Vercel Token
1. Go to [Vercel Settings > Tokens](https://vercel.com/account/tokens).
2. Create a new token named "SnapStream CLI".
3. Copy the token.

## 2. Get your Project IDs
1. Go to your Vercel Dashboard.
2. Select your Project.
3. Go to **Settings > General**.
4. Copy the **Project ID**.
5. Do the same for your Backend project if it is separate.

## 3. Add Secrets to GitHub
1. Go to your repository on GitHub.
2. Click **Settings** (top tab).
3. On the left sidebar, click **Secrets and variables** > **Actions**.
4. Click **New repository secret** for each of these:

| Secret Name | Description |
|---|---|
| `VERCEL_TOKEN` | The token you created in Step 1 |
| `VERCEL_ORG_ID` | Your Vercel User/Org ID (found in project settings or account) |
| `VERCEL_PROJECT_ID` | The ID for your FRONTEND project |
| `VERCEL_BACKEND_PROJECT_ID` | The ID for your BACKEND project |
| `VITE_API_URL` | Your production API URL (e.g., `https://your-api.vercel.app`) |

## 4. Deploy
Once you add these secrets, the next time you push code to `main`, GitHub will automatically deploy your application!
