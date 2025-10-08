@echo off
echo Starting Viking Hammer Mobile App...
echo.

cd /d "%~dp0apps\mobile-gym"
echo Current directory: %CD%
echo.

echo Installing dependencies if needed...
call npm install
echo.

echo Starting Expo development server...
echo.
echo Once started, you can:
echo 1. Download "Expo Go" app on your phone
echo 2. Scan the QR code that appears
echo 3. Or press 'w' to open in web browser
echo.

call npx expo start --tunnel

pause