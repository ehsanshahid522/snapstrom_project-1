@echo off
echo Adding all changes...
git add .

echo Committing chat interface changes...
git commit -m "feat: Complete chat interface with database schemas and messaging logic"

echo Pushing to GitHub...
git push origin main

echo Done! Chat interface has been deployed.
pause
