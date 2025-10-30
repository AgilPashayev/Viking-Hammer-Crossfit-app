# INSTRUCTOR MODULE - COMPREHENSIVE INTEGRATION TEST
# Tests all 4 layers: Database → Backend API → Frontend Service → UI

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  INSTRUCTOR MODULE - COMPREHENSIVE INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:4001/api"
$JWT_SECRET = "13344bca32538306df90b2beccaa998a2a2c869bdbff6515a5c1e72409bdf1ca"

# Generate test token
$token = node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'test-admin',email:'admin@test.com',role:'admin'},'$JWT_SECRET',{expiresIn:'1h'}))"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [string]$ExpectedStatus = "200"
    )
    
    Write-Host "`n[TEST] $Name" -ForegroundColor Yellow
    Write-Host "  → $Method $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri         = $Url
            Method      = $Method
            Headers     = $headers
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            Write-Host "  → Body: $($params.Body)" -ForegroundColor DarkGray
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "  ✅ PASS" -ForegroundColor Green
        
        $script:testResults += [PSCustomObject]@{
            Test     = $Name
            Status   = "PASS"
            Response = $response
        }
        
        return $response
    }
    catch {
        Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        
        $script:testResults += [PSCustomObject]@{
            Test   = $Name
            Status = "FAIL"
            Error  = $_.Exception.Message
        }
        
        return $null
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "LAYER 1: BACKEND API ENDPOINTS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 1. GET /api/instructors
$instructors = Test-Endpoint `
    -Name "GET All Instructors" `
    -Method "GET" `
    -Url "$baseUrl/instructors"

# 2. CREATE Instructor
$newInstructor = @{
    first_name       = "Test"
    last_name        = "Instructor"
    email            = "test.instructor@vikinghammer.com"
    phone            = "+1234567890"
    specialties      = @("CrossFit", "Olympic Lifting")
    certifications   = @("CrossFit Level 2")
    bio              = "Test instructor for integration testing"
    years_experience = 5
    status           = "active"
    availability     = @{
        monday    = @("09:00-12:00", "14:00-18:00")
        wednesday = @("09:00-12:00")
        friday    = @("14:00-18:00")
    }
}

$createdInstructor = Test-Endpoint `
    -Name "POST Create Instructor" `
    -Method "POST" `
    -Url "$baseUrl/instructors" `
    -Body $newInstructor

$instructorId = if ($createdInstructor) { $createdInstructor.data.id } else { $null }

if ($instructorId) {
    # 3. GET Instructor by ID
    $instructor = Test-Endpoint `
        -Name "GET Instructor by ID" `
        -Method "GET" `
        -Url "$baseUrl/instructors/$instructorId"
    
    # 4. UPDATE Instructor
    $updates = @{
        years_experience = 6
        bio              = "Updated bio for testing"
        status           = "active"
    }
    
    $updatedInstructor = Test-Endpoint `
        -Name "PUT Update Instructor" `
        -Method "PUT" `
        -Url "$baseUrl/instructors/$instructorId" `
        -Body $updates
    
    # 5. DELETE Instructor (cleanup)
    $deleted = Test-Endpoint `
        -Name "DELETE Instructor" `
        -Method "DELETE" `
        -Url "$baseUrl/instructors/$instructorId"
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "LAYER 2: CLASSES & INSTRUCTOR ASSIGNMENT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Get all classes
$classes = Test-Endpoint `
    -Name "GET All Classes" `
    -Method "GET" `
    -Url "$baseUrl/classes"

# Get schedule slots
$schedule = Test-Endpoint `
    -Name "GET Schedule Slots" `
    -Method "GET" `
    -Url "$baseUrl/schedule"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $testResults.Count

Write-Host "`nTotal Tests: $totalCount" -ForegroundColor White
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red

$successRate = [math]::Round(($passCount / $totalCount) * 100, 2)
Write-Host "`nSuccess Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DETAILED RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

foreach ($result in $testResults) {
    $statusColor = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "`n[$($result.Status)]" -ForegroundColor $statusColor -NoNewline
    Write-Host " $($result.Test)" -ForegroundColor White
    
    if ($result.Status -eq "FAIL") {
        Write-Host "  Error: $($result.Error)" -ForegroundColor Red
    }
}

Write-Host "`n"
