@echo off
echo Starting Viking Hammer CrossFit Application...
echo.

echo Starting Backend API Server...
start "Backend API" cmd /k "cd /d C:\Users\AgiL\viking-hammer-crossfit-app && node backend-server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend Development Server...
start "Frontend" cmd /k "cd /d C:\Users\AgiL\viking-hammer-crossfit-app\frontend && npm run dev"

echo.
echo ===================================
echo Viking Hammer CrossFit App Started
echo ===================================
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:3001
echo API Health: http://localhost:3001/api/health
echo.
echo Press any key to open the application in browser...
pause >nul

start "" "http://localhost:5173"

echo.
echo Application is running!
echo Close the terminal windows to stop the servers.
echo.
pause