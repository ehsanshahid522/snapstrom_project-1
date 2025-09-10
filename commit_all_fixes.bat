@echo off
cd /d F:\snapstream
echo Adding all changes...
git add .
echo Committing all fixes...
git commit -m "Fix React error #31, database 503 errors, and improve system stability

- Fix React error #31 related to timestamp object rendering in Chat component
- Improve timestamp validation in formatMessageTime function with better type checking
- Fix 503 Service Unavailable errors for chat conversations API
- Enhance database connection handling with better retry logic and error recovery
- Add database connection test endpoint for debugging
- Improve MongoDB connection options for Vercel/serverless environment
- Add comprehensive error handling for database connection failures
- Complete profile 404 error handling system with user-friendly error pages
- Add username validation utilities to prevent invalid profile URLs
- Update Nav and Feed components with validation integration"
echo Pushing to GitHub...
git push origin main
echo Done! All fixes pushed successfully.
pause
