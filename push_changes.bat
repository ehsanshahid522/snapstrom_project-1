@echo off
cd /d F:\snapstream
echo Adding files...
git add .
echo Committing changes...
git commit -m "fix: Fix showUserSearch error and complete search cleanup"
echo Pushing to GitHub...
git push origin main
echo Done!
pause
