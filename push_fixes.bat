@echo off
cd /d F:\snapstream
echo Adding all changes...
git add .
echo Committing React error fixes...
git commit -m "Fix React error #31 and improve timestamp handling

- Fix React error #31 related to timestamp object rendering
- Improve timestamp validation in formatMessageTime function
- Add better type checking for timestamp objects
- Ensure all timestamps are converted to strings before rendering"
echo Pushing to GitHub...
git push origin main
echo Done! All fixes pushed successfully.
pause
