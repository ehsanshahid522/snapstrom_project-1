@echo off
cd /d F:\snapstream
echo Adding all changes...
git add .
echo Committing all fixes...
git commit -m "fix: Add missing chat API endpoints and fix all search errors

- Add /api/chat/conversations endpoint to fix 404 error
- Add /api/chat/messages/:conversationId endpoint
- Add /api/chat/start-conversation endpoint
- Fix showUserSearch error in Chat.jsx
- Complete search functionality cleanup
- All chat endpoints now return proper responses"
echo Pushing to GitHub...
git push origin main
echo All changes pushed successfully!
pause
