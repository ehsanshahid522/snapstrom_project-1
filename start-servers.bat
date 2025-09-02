@echo off
echo Starting SnapStream servers...

REM Set environment variables
set MONGO_URI=mongodb://localhost:27017/snapstream
set JWT_SECRET=test-secret-key
set NODE_ENV=development

REM Start backend server in a new window
start "Backend Server" cmd /k "node api/server.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server in a new window
start "Frontend Server" cmd /k "cd frontend\client && npm run dev"

echo Servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul
