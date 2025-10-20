# Insert Test Announcement Script
# Run this to insert a test announcement into your database

Write-Host "Test Announcement Insertion Helper" -ForegroundColor Cyan
Write-Host ""

# Read the SQL file
$sqlFile = "insert-test-announcement-simple.sql"
if (Test-Path $sqlFile) {
    $sqlContent = Get-Content $sqlFile -Raw
    
    Write-Host "SQL Preview:" -ForegroundColor Yellow
    Write-Host $sqlContent -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Open Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Navigate to: SQL Editor" -ForegroundColor White
    Write-Host "3. Copy the SQL above" -ForegroundColor White
    Write-Host "4. Paste and click Run" -ForegroundColor White
    Write-Host "5. Refresh your Member Dashboard at http://localhost:5173" -ForegroundColor White
    Write-Host "6. Login as a Member user" -ForegroundColor White
    Write-Host "7. You should see the announcement popup" -ForegroundColor White
    Write-Host ""
    
}
else {
    Write-Host "Error: SQL file not found" -ForegroundColor Red
    Write-Host "Expected: insert-test-announcement-simple.sql" -ForegroundColor Yellow
}
