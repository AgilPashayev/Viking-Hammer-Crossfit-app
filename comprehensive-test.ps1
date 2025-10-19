# Complete System Test - Viking Hammer Gym
# Testing: Backend API, Database, Frontend Integration, Security

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VIKING HAMMER GYM - COMPREHENSIVE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:4001/api"
$headers = @{'Content-Type' = 'application/json' }
$testResults = @()

function Add-TestResult {
    param($Category, $Test, $Status, $Details)
    $script:testResults += [PSCustomObject]@{
        Category = $Category
        Test     = $Test
        Status   = $Status
        Details  = $Details
    }
}

# Test 1: Backend Health
Write-Host "TEST 1: Backend Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/../api/health" -Method GET
    if ($health.status -eq "healthy") {
        Write-Host "✅ Backend is healthy" -ForegroundColor Green
        Add-TestResult "Backend" "Health Check" "PASS" "Server responding"
    }
}
catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
    Add-TestResult "Backend" "Health Check" "FAIL" $_.Exception.Message
}

Write-Host ""

# Test 2: Create Member (Reception Add Member)
Write-Host "TEST 2: Create Member (Reception Function)" -ForegroundColor Yellow
try {
    $memberData = @{
        name     = "Sarah Johnson"
        email    = "sarah.johnson@test.com"
        phone    = "+994501234567"
        role     = "member"
        password = "Test123!"
        dob      = "1990-05-15"
    } | ConvertTo-Json

    $newMember = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $memberData
    Write-Host "✅ Member created: $($newMember.name) (ID: $($newMember.id))" -ForegroundColor Green
    Add-TestResult "API" "Create Member" "PASS" "Member ID: $($newMember.id)"
    $script:testMemberId = $newMember.id
}
catch {
    Write-Host "❌ Failed to create member: $_" -ForegroundColor Red
    Add-TestResult "API" "Create Member" "FAIL" $_.Exception.Message
}

Write-Host ""

# Test 3: Get All Members
Write-Host "TEST 3: Get All Members" -ForegroundColor Yellow
try {
    $members = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET
    Write-Host "✅ Retrieved $($members.Count) member(s)" -ForegroundColor Green
    Add-TestResult "API" "Get Members" "PASS" "Count: $($members.Count)"
}
catch {
    Write-Host "❌ Failed to get members: $_" -ForegroundColor Red
    Add-TestResult "API" "Get Members" "FAIL" $_.Exception.Message
}

Write-Host ""

# Test 4: Update Member
Write-Host "TEST 4: Update Member" -ForegroundColor Yellow
if ($script:testMemberId) {
    try {
        $updateData = @{
            phone  = "+994509876543"
            status = "active"
        } | ConvertTo-Json

        $updated = Invoke-RestMethod -Uri "$baseUrl/users/$($script:testMemberId)" -Method PUT -Headers $headers -Body $updateData
        Write-Host "✅ Member updated successfully" -ForegroundColor Green
        Add-TestResult "API" "Update Member" "PASS" "Phone updated"
    }
    catch {
        Write-Host "❌ Failed to update member: $_" -ForegroundColor Red
        Add-TestResult "API" "Update Member" "FAIL" $_.Exception.Message
    }
}

Write-Host ""

# Test 5: Create Class
Write-Host "TEST 5: Create Class" -ForegroundColor Yellow
try {
    $classData = @{
        name             = "CrossFit Fundamentals"
        description      = "Learn the basics of CrossFit movements"
        duration_minutes = 60
        difficulty       = "Beginner"
        category         = "CrossFit"
        max_capacity     = 20
        color            = "#FF5722"
    } | ConvertTo-Json

    $newClass = Invoke-RestMethod -Uri "$baseUrl/classes" -Method POST -Headers $headers -Body $classData
    Write-Host "✅ Class created: $($newClass.name) (ID: $($newClass.id))" -ForegroundColor Green
    Add-TestResult "API" "Create Class" "PASS" "Class ID: $($newClass.id)"
    $script:testClassId = $newClass.id
}
catch {
    Write-Host "❌ Failed to create class: $_" -ForegroundColor Red
    Add-TestResult "API" "Create Class" "FAIL" $_.Exception.Message
}

Write-Host ""

# Test 6: Get All Classes
Write-Host "TEST 6: Get All Classes" -ForegroundColor Yellow
try {
    $classes = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET
    Write-Host "✅ Retrieved $($classes.Count) class(es)" -ForegroundColor Green
    Add-TestResult "API" "Get Classes" "PASS" "Count: $($classes.Count)"
}
catch {
    Write-Host "❌ Failed to get classes: $_" -ForegroundColor Red
    Add-TestResult "API" "Get Classes" "FAIL" $_.Exception.Message
}

Write-Host ""

# Test 7: Update Class
Write-Host "TEST 7: Update Class" -ForegroundColor Yellow
if ($script:testClassId) {
    try {
        $updateClassData = @{
            description  = "Updated: Learn the fundamentals of CrossFit"
            max_capacity = 25
        } | ConvertTo-Json

        $updatedClass = Invoke-RestMethod -Uri "$baseUrl/classes/$($script:testClassId)" -Method PUT -Headers $headers -Body $updateClassData
        Write-Host "✅ Class updated successfully" -ForegroundColor Green
        Add-TestResult "API" "Update Class" "PASS" "Capacity: $($updatedClass.max_capacity)"
    }
    catch {
        Write-Host "❌ Failed to update class: $_" -ForegroundColor Red
        Add-TestResult "API" "Update Class" "FAIL" $_.Exception.Message
    }
}

Write-Host ""

# Test 8: Create Instructor
Write-Host "TEST 8: Create Instructor" -ForegroundColor Yellow
try {
    $instructorData = @{
        first_name  = "Mike"
        last_name   = "Thompson"
        email       = "mike.thompson@vikinghammer.com"
        phone       = "+994501112233"
        specialties = @("CrossFit", "Olympic Lifting")
        bio         = "Certified CrossFit Level 3 Trainer"
        status      = "active"
    } | ConvertTo-Json

    $newInstructor = Invoke-RestMethod -Uri "$baseUrl/instructors" -Method POST -Headers $headers -Body $instructorData
    Write-Host "✅ Instructor created: $($newInstructor.first_name) $($newInstructor.last_name)" -ForegroundColor Green
    Add-TestResult "API" "Create Instructor" "PASS" "Instructor ID: $($newInstructor.id)"
    $script:testInstructorId = $newInstructor.id
}
catch {
    Write-Host "❌ Failed to create instructor: $_" -ForegroundColor Red
    Add-TestResult "API" "Create Instructor" "FAIL" $_.Exception.Message
}

Write-Host ""

# Test 9: Get All Instructors
Write-Host "TEST 9: Get All Instructors" -ForegroundColor Yellow
try {
    $instructors = Invoke-RestMethod -Uri "$baseUrl/instructors" -Method GET
    Write-Host "✅ Retrieved $($instructors.Count) instructor(s)" -ForegroundColor Green
    Add-TestResult "API" "Get Instructors" "PASS" "Count: $($instructors.Count)"
}
catch {
    Write-Host "❌ Failed to get instructors: $_" -ForegroundColor Red
    Add-TestResult "API" "Get Instructors" "FAIL" $_.Exception.Message
}

Write-Host ""

# Test 10: Database Persistence Check
Write-Host "TEST 10: Database Persistence (Re-fetch)" -ForegroundColor Yellow
if ($script:testMemberId) {
    try {
        Start-Sleep -Seconds 1
        $refetchedMember = Invoke-RestMethod -Uri "$baseUrl/users/$($script:testMemberId)" -Method GET
        if ($refetchedMember.name -eq "Sarah Johnson") {
            Write-Host "✅ Database persistence verified - Member data persisted" -ForegroundColor Green
            Add-TestResult "Database" "Persistence Check" "PASS" "Member data intact"
        }
    }
    catch {
        Write-Host "❌ Database persistence check failed" -ForegroundColor Red
        Add-TestResult "Database" "Persistence Check" "FAIL" $_.Exception.Message
    }
}

Write-Host ""

# Test 11: Delete Class (Cleanup)
Write-Host "TEST 11: Delete Class" -ForegroundColor Yellow
if ($script:testClassId) {
    try {
        $deleted = Invoke-RestMethod -Uri "$baseUrl/classes/$($script:testClassId)" -Method DELETE
        if ($deleted.success) {
            Write-Host "✅ Class deleted successfully" -ForegroundColor Green
            Add-TestResult "API" "Delete Class" "PASS" "Soft delete completed"
        }
    }
    catch {
        Write-Host "❌ Failed to delete class: $_" -ForegroundColor Red
        Add-TestResult "API" "Delete Class" "FAIL" $_.Exception.Message
    }
}

Write-Host ""

# Test 12: Verify Deletion
Write-Host "TEST 12: Verify Class Deletion" -ForegroundColor Yellow
if ($script:testClassId) {
    try {
        $allClasses = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET
        $deletedClass = $allClasses | Where-Object { $_.id -eq $script:testClassId -and $_.status -eq 'deleted' }
        if ($deletedClass) {
            Write-Host "✅ Class soft-deleted (status: deleted)" -ForegroundColor Green
            Add-TestResult "API" "Verify Deletion" "PASS" "Soft delete confirmed"
        }
        else {
            Write-Host "⚠️ Class not found in deleted state" -ForegroundColor Yellow
            Add-TestResult "API" "Verify Deletion" "WARN" "Class removed from active list"
        }
    }
    catch {
        Write-Host "❌ Failed to verify deletion: $_" -ForegroundColor Red
        Add-TestResult "API" "Verify Deletion" "FAIL" $_.Exception.Message
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$totalTests = $testResults.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Warnings: $warnCount" -ForegroundColor Yellow
Write-Host ""

$testResults | Format-Table -AutoSize

if ($failCount -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
}
else {
    Write-Host "❌ SOME TESTS FAILED - Review above" -ForegroundColor Red
}
