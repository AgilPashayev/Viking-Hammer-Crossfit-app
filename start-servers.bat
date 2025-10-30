@echo off
echo ======================================
echo  Viking Hammer CrossFit App Startup
echo ======================================

echo Starting Backend Server...
start "Backend Server" cmd /c "cd /d C:\Users\AgiL\viking-hammer-crossfit-app && node backend-server.js"

timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /c "cd /d C:\Users\AgiL\viking-hammer-crossfit-app\frontend && npx vite --port 5173 --host"

timeout /t 3 /nobreak > nul

echo.
echo ======================================
echo  Servers Starting...
echo ======================================
echo Backend:  http://localhost:4001
echo Frontend: http://localhost:5173
echo.
echo Both servers are starting in separate windows.
echo Wait a few seconds, then open: http://localhost:5173
echo ======================================

pause