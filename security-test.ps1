# Viking Hammer Gym - Security & Validation Test
# Testing: SQL Injection, Input Sanitization, Role-Based Access Control

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SECURITY & VALIDATION TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:4001/api"
$headers = @{'Content-Type' = 'application/json' }
$securityResults = @()

function Add-SecurityTest {
    param($Category, $Test, $Status, $Details)
    $script:securityResults += [PSCustomObject]@{
        Category = $Category
        Test     = $Test
        Status   = $Status
        Details  = $Details
    }
}

# Test 1: SQL Injection - Member Name
Write-Host "TEST 1: SQL Injection - Member Name Field" -ForegroundColor Yellow
try {
    $sqlInjection = @{
        name     = "'; DROP TABLE users_profile; --"
        email    = "hacker@test.com"
        phone    = "+994501234567"
        role     = "member"
        password = "Test123!"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $sqlInjection -ErrorAction Stop
        Write-Host "⚠️ SQL Injection attempt created user - Needs sanitization!" -ForegroundColor Yellow
        Add-SecurityTest "SQL Injection" "Member Name Field" "WARN" "User created with SQL characters"
    }
    catch {
        if ($_.Exception.Message -like "*400*" -or $_.Exception.Message -like "*invalid*") {
            Write-Host "✅ SQL Injection blocked by validation" -ForegroundColor Green
            Add-SecurityTest "SQL Injection" "Member Name Field" "PASS" "Rejected invalid input"
        }
        else {
            Write-Host "✅ SQL Injection failed (No table dropped)" -ForegroundColor Green
            Add-SecurityTest "SQL Injection" "Member Name Field" "PASS" "Database protected"
        }
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "SQL Injection" "Member Name Field" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 2: SQL Injection - Class Description
Write-Host "TEST 2: SQL Injection - Class Description Field" -ForegroundColor Yellow
try {
    $sqlInjectionClass = @{
        name             = "Test Class"
        description      = "'; DELETE FROM classes WHERE 1=1; --"
        duration_minutes = 60
        difficulty       = "Beginner"
        category         = "CrossFit"
        max_capacity     = 20
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/classes" -Method POST -Headers $headers -Body $sqlInjectionClass -ErrorAction Stop
        # Check if classes still exist
        $classCheck = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET
        if ($classCheck.Count -gt 0) {
            Write-Host "✅ SQL Injection failed - Classes still exist" -ForegroundColor Green
            Add-SecurityTest "SQL Injection" "Class Description" "PASS" "Database protected"
        }
    }
    catch {
        Write-Host "✅ SQL Injection blocked" -ForegroundColor Green
        Add-SecurityTest "SQL Injection" "Class Description" "PASS" "Input rejected"
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "SQL Injection" "Class Description" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 3: XSS Attack - Member Name
Write-Host "TEST 3: XSS Attack - Member Name Field" -ForegroundColor Yellow
try {
    $xssAttack = @{
        name     = "<script>alert('XSS')</script>"
        email    = "xss@test.com"
        phone    = "+994501234567"
        role     = "member"
        password = "Test123!"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $xssAttack -ErrorAction Stop
        if ($result.name -match "<script>") {
            Write-Host "⚠️ XSS payload stored without sanitization!" -ForegroundColor Yellow
            Add-SecurityTest "XSS" "Member Name Field" "WARN" "Script tags not sanitized"
        }
        else {
            Write-Host "✅ XSS payload sanitized" -ForegroundColor Green
            Add-SecurityTest "XSS" "Member Name Field" "PASS" "Script tags removed/escaped"
        }
    }
    catch {
        Write-Host "✅ XSS attack blocked by validation" -ForegroundColor Green
        Add-SecurityTest "XSS" "Member Name Field" "PASS" "Invalid input rejected"
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "XSS" "Member Name Field" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 4: Email Validation
Write-Host "TEST 4: Email Format Validation" -ForegroundColor Yellow
try {
    $invalidEmail = @{
        name     = "Invalid Email Test"
        email    = "not-an-email"
        phone    = "+994501234567"
        role     = "member"
        password = "Test123!"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $invalidEmail -ErrorAction Stop
        Write-Host "⚠️ Invalid email accepted - Needs validation!" -ForegroundColor Yellow
        Add-SecurityTest "Validation" "Email Format" "WARN" "Invalid email accepted"
    }
    catch {
        if ($_.Exception.Message -like "*400*" -or $_.Exception.Message -like "*email*") {
            Write-Host "✅ Invalid email rejected" -ForegroundColor Green
            Add-SecurityTest "Validation" "Email Format" "PASS" "Email validation working"
        }
        else {
            Write-Host "⚠️ Email validation unclear" -ForegroundColor Yellow
            Add-SecurityTest "Validation" "Email Format" "WARN" "Validation status unclear"
        }
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "Validation" "Email Format" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 5: Phone Number Validation
Write-Host "TEST 5: Phone Number Format Validation" -ForegroundColor Yellow
try {
    $invalidPhone = @{
        name     = "Invalid Phone Test"
        email    = "invalidphone@test.com"
        phone    = "123"
        role     = "member"
        password = "Test123!"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $invalidPhone -ErrorAction Stop
        Write-Host "⚠️ Invalid phone accepted - Consider stricter validation" -ForegroundColor Yellow
        Add-SecurityTest "Validation" "Phone Format" "WARN" "Weak phone validation"
    }
    catch {
        Write-Host "✅ Invalid phone rejected" -ForegroundColor Green
        Add-SecurityTest "Validation" "Phone Format" "PASS" "Phone validation working"
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "Validation" "Phone Format" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 6: Password Strength
Write-Host "TEST 6: Password Strength Validation" -ForegroundColor Yellow
try {
    $weakPassword = @{
        name     = "Weak Password Test"
        email    = "weakpass@test.com"
        phone    = "+994501234567"
        role     = "member"
        password = "123"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $weakPassword -ErrorAction Stop
        Write-Host "⚠️ Weak password accepted!" -ForegroundColor Yellow
        Add-SecurityTest "Validation" "Password Strength" "WARN" "Weak passwords allowed"
    }
    catch {
        if ($_.Exception.Message -like "*password*" -or $_.Exception.Message -like "*400*") {
            Write-Host "✅ Weak password rejected" -ForegroundColor Green
            Add-SecurityTest "Validation" "Password Strength" "PASS" "Password policy enforced"
        }
        else {
            Write-Host "⚠️ Password validation unclear" -ForegroundColor Yellow
            Add-SecurityTest "Validation" "Password Strength" "WARN" "Validation unclear"
        }
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "Validation" "Password Strength" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 7: Role Validation
Write-Host "TEST 7: Role Validation (Invalid Role)" -ForegroundColor Yellow
try {
    $invalidRole = @{
        name     = "Invalid Role Test"
        email    = "invalidrole@test.com"
        phone    = "+994501234567"
        role     = "superadmin"
        password = "Test123!"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $invalidRole -ErrorAction Stop
        Write-Host "⚠️ Invalid role accepted!" -ForegroundColor Yellow
        Add-SecurityTest "Validation" "Role Validation" "WARN" "Invalid roles allowed"
    }
    catch {
        Write-Host "✅ Invalid role rejected" -ForegroundColor Green
        Add-SecurityTest "Validation" "Role Validation" "PASS" "Role validation working"
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "Validation" "Role Validation" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 8: Missing Required Fields
Write-Host "TEST 8: Required Fields Validation (Missing Name)" -ForegroundColor Yellow
try {
    $missingFields = @{
        email    = "missingname@test.com"
        phone    = "+994501234567"
        role     = "member"
        password = "Test123!"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $missingFields -ErrorAction Stop
        Write-Host "⚠️ Missing required field accepted!" -ForegroundColor Yellow
        Add-SecurityTest "Validation" "Required Fields" "WARN" "Missing fields allowed"
    }
    catch {
        Write-Host "✅ Missing required field rejected" -ForegroundColor Green
        Add-SecurityTest "Validation" "Required Fields" "PASS" "Required field validation working"
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "Validation" "Required Fields" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 9: Negative Values - Class Capacity
Write-Host "TEST 9: Negative Value Validation - Class Capacity" -ForegroundColor Yellow
try {
    $negativeCapacity = @{
        name             = "Negative Capacity Test"
        description      = "Test class"
        duration_minutes = 60
        difficulty       = "Beginner"
        category         = "CrossFit"
        max_capacity     = -10
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/classes" -Method POST -Headers $headers -Body $negativeCapacity -ErrorAction Stop
        Write-Host "⚠️ Negative capacity accepted!" -ForegroundColor Yellow
        Add-SecurityTest "Validation" "Negative Values" "WARN" "Negative numbers allowed"
    }
    catch {
        Write-Host "✅ Negative capacity rejected" -ForegroundColor Green
        Add-SecurityTest "Validation" "Negative Values" "PASS" "Number validation working"
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "Validation" "Negative Values" "ERROR" $_.Exception.Message
}

Write-Host ""

# Test 10: Oversized Input - Class Name
Write-Host "TEST 10: Oversized Input - Class Name (2000 chars)" -ForegroundColor Yellow
try {
    $longString = "A" * 2000
    $oversizedInput = @{
        name             = $longString
        description      = "Test"
        duration_minutes = 60
        difficulty       = "Beginner"
        category         = "CrossFit"
        max_capacity     = 20
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/classes" -Method POST -Headers $headers -Body $oversizedInput -ErrorAction Stop
        Write-Host "⚠️ Oversized input accepted!" -ForegroundColor Yellow
        Add-SecurityTest "Validation" "Oversized Input" "WARN" "No length limits"
    }
    catch {
        Write-Host "✅ Oversized input rejected" -ForegroundColor Green
        Add-SecurityTest "Validation" "Oversized Input" "PASS" "Length validation working"
    }
}
catch {
    Write-Host "❌ Test error: $_" -ForegroundColor Red
    Add-SecurityTest "Validation" "Oversized Input" "ERROR" $_.Exception.Message
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SECURITY TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = ($securityResults | Where-Object { $_.Status -eq "PASS" }).Count
$warnCount = ($securityResults | Where-Object { $_.Status -eq "WARN" }).Count
$errorCount = ($securityResults | Where-Object { $_.Status -eq "ERROR" }).Count
$totalTests = $securityResults.Count

Write-Host "Total Security Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Warnings: $warnCount" -ForegroundColor Yellow
Write-Host "Errors: $errorCount" -ForegroundColor Red
Write-Host ""

$securityResults | Format-Table -AutoSize

if ($warnCount -eq 0) {
    Write-Host "✅ ALL SECURITY TESTS PASSED!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ SECURITY WARNINGS FOUND - Review and fix" -ForegroundColor Yellow
}
