# Viking Hammer Dev Servers Startup Script
Write-Host "Viking Hammer Development Environment" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Set Node.js path and increase memory
$env:PATH = "C:\Users\AgiL\AppData\Local\nvm\v18.16.0;$env:PATH"
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# Kill existing Node processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd C:\Users\AgiL\viking-hammer-crossfit-app; node backend-server.js`""

Start-Sleep -Seconds 3

# Start Frontend  
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd C:\Users\AgiL\viking-hammer-crossfit-app\frontend; npm run dev`""

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Servers starting in separate windows!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:4001" -ForegroundColor Cyan

