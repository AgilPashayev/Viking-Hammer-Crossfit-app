@echo off
echo Stopping Viking Hammer CrossFit Application...
echo.

echo Stopping Node.js processes...
taskkill /f /im node.exe 2>nul

echo Stopping any remaining development servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4001 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo.
echo All services stopped!
echo.
pause