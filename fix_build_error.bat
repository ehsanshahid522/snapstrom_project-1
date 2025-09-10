@echo off
cd /d F:\snapstream
echo Adding build error fix...
git add .
echo Committing build error fix...
git commit -m "FIX: Build error - async/await in useEffect

🔧 BUILD ERROR FIX:

✅ FIXED Async/Await Error:
- Fixed 'await' can only be used inside an 'async' function error
- Moved async API call into separate async function
- Fixed useEffect callback to properly handle async operations
- Build should now succeed without errors

📁 FILES MODIFIED:
- frontend/client/src/pages/Chat.jsx (async/await fix)

✅ EXPECTED RESULTS:
- Vercel build will succeed without errors
- Chat functionality remains intact
- No breaking changes to existing features

🚀 Build is now ready for deployment!"
echo Pushing to GitHub...
git push origin main
echo Done! Build error fixed and ready for deployment!
pause
