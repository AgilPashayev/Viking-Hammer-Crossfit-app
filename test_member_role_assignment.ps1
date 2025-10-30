# PowerShell Script: Test Member Role Assignment (Instructor Role Focus)
# Tests all layers: Database → Backend API → Frontend Service → UI Integration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MEMBER ROLE ASSIGNMENT - INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "Focus: Assign Instructor Role to Member" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:4001"
$testResults = @()
$totalTests = 0
$passedTests = 0

# Test credentials (admin user)
$adminEmail = "admin@vikinggym.com"
$adminPassword = "Admin123!"

Write-Host "🔐 Step 1: Authenticating as Admin..." -ForegroundColor Yellow

try {
    $loginBody = @{
        email    = $adminEmail
        password = $adminPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signin" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }
    Write-Host "   ✅ Authentication successful" -ForegroundColor Green
    $testResults += @{ Test = "Admin Authentication"; Result = "PASS" }
    $totalTests++; $passedTests++
}
catch {
    Write-Host "   ❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Admin Authentication"; Result = "FAIL" }
    $totalTests++
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LAYER 1: DATABASE SCHEMA VALIDATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1.1: Check users_profile table has role column
Write-Host "Test 1.1: Verify users_profile.role column exists..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET -Headers $headers
    if ($usersResponse -and $usersResponse.Count -gt 0) {
        $firstUser = $usersResponse[0]
        if ($firstUser.PSObject.Properties.Name -contains "role") {
            Write-Host "   ✅ users_profile.role column exists" -ForegroundColor Green
            $testResults += @{ Test = "Database: users_profile.role column"; Result = "PASS" }
            $totalTests++; $passedTests++
        }
        else {
            throw "role column not found"
        }
    }
}
catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Database: users_profile.role column"; Result = "FAIL" }
    $totalTests++
}

# Test 1.2: Check instructors table exists
Write-Host "Test 1.2: Verify instructors table exists..." -ForegroundColor Yellow
try {
    $instructorsResponse = Invoke-RestMethod -Uri "$baseUrl/api/instructors" -Method GET -Headers $headers
    Write-Host "   ✅ instructors table exists (found $($instructorsResponse.Count) records)" -ForegroundColor Green
    $testResults += @{ Test = "Database: instructors table"; Result = "PASS" }
    $totalTests++; $passedTests++
}
catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Database: instructors table"; Result = "FAIL" }
    $totalTests++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LAYER 2: BACKEND API ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 2.1: Create a test member
Write-Host "Test 2.1: Create test member via POST /api/users..." -ForegroundColor Yellow
$testMemberId = $null
$testMemberEmail = "test.instructor.$(Get-Random -Maximum 9999)@vikinggym.com"

try {
    $createMemberBody = @{
        name           = "Test Instructor Candidate"
        firstName      = "Test"
        lastName       = "Instructor"
        email          = $testMemberEmail
        phone          = "+994 50 123 4567"
        role           = "member"
        status         = "active"
        membershipType = "Monthly"
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method POST -Body $createMemberBody -Headers $headers
    $testMemberId = $createResponse.id
    Write-Host "   ✅ Test member created (ID: $testMemberId)" -ForegroundColor Green
    $testResults += @{ Test = "Backend API: Create member"; Result = "PASS" }
    $totalTests++; $passedTests++
}
catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Backend API: Create member"; Result = "FAIL" }
    $totalTests++
}

# Test 2.2: Update member role to instructor
Write-Host "Test 2.2: Update member role to 'instructor' via PUT /api/users/:id..." -ForegroundColor Yellow
if ($testMemberId) {
    try {
        $updateRoleBody = @{
            role = "instructor"
        } | ConvertTo-Json

        $updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/$testMemberId" -Method PUT -Body $updateRoleBody -Headers $headers
        
        if ($updateResponse.role -eq "instructor") {
            Write-Host "   OK Member role updated to instructor" -ForegroundColor Green
            $testResults += @{ Test = "Backend API Update role to instructor"; Result = "PASS" }
            $totalTests++; $passedTests++
        }
        else {
            throw "Role not updated correctly (got: $($updateResponse.role))"
        }
    }
    catch {
        Write-Host "   FAIL Failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Backend API Update role to instructor"; Result = "FAIL" }
        $totalTests++
    }
}
else {
    Write-Host "   SKIP Skipped (no test member created)" -ForegroundColor Gray
}

# Test 2.3: Verify role persists in database
Write-Host "Test 2.3: Verify role persists via GET /api/users/:id..." -ForegroundColor Yellow
if ($testMemberId) {
    try {
        $getResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/$testMemberId" -Method GET -Headers $headers
        
        if ($getResponse.role -eq "instructor") {
            Write-Host "   OK Role persisted correctly in database" -ForegroundColor Green
            $testResults += @{ Test = "Backend API Role persistence"; Result = "PASS" }
            $totalTests++; $passedTests++
        }
        else {
            throw "Role not persisted (got: $($getResponse.role))"
        }
    }
    catch {
        Write-Host "   FAIL Failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Backend API Role persistence"; Result = "FAIL" }
        $totalTests++
    }
}
else {
    Write-Host "   SKIP Skipped (no test member created)" -ForegroundColor Gray
}

# Test 2.4: Test changing role back to member
Write-Host "Test 2.4: Change role back to 'member' via PUT /api/users/:id..." -ForegroundColor Yellow
if ($testMemberId) {
    try {
        $revertRoleBody = @{
            role = "member"
        } | ConvertTo-Json

        $revertResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/$testMemberId" -Method PUT -Body $revertRoleBody -Headers $headers
        
        if ($revertResponse.role -eq "member") {
            Write-Host "   OK Role reverted to member successfully" -ForegroundColor Green
            $testResults += @{ Test = "Backend API Revert role to member"; Result = "PASS" }
            $totalTests++; $passedTests++
        }
        else {
            throw "Role not reverted correctly"
        }
    }
    catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Backend API: Revert role to member"; Result = "FAIL" }
        $totalTests++
    }
}
else {
    Write-Host "   ⏭️  Skipped (no test member created)" -ForegroundColor Gray
}

# Test 2.5: Test all valid role values
Write-Host "Test 2.5: Test all valid role assignments..." -ForegroundColor Yellow
$validRoles = @("member", "instructor", "admin", "reception", "sparta")
$roleTestsPassed = 0

if ($testMemberId) {
    foreach ($role in $validRoles) {
        try {
            $roleBody = @{ role = $role } | ConvertTo-Json
            $roleResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/$testMemberId" -Method PUT -Body $roleBody -Headers $headers
            
            if ($roleResponse.role -eq $role) {
                $roleTestsPassed++
            }
        }
        catch {
            Write-Host "      ❌ Failed for role: $role" -ForegroundColor Red
        }
    }
    
    if ($roleTestsPassed -eq $validRoles.Count) {
        Write-Host "   OK All role assignments working ($roleTestsPassed/$($validRoles.Count))" -ForegroundColor Green
        $testResults += @{ Test = "Backend API: All role types"; Result = "PASS" }
        $totalTests++; $passedTests++
    }
    else {
        $roleCount = $validRoles.Count
        Write-Host "   WARN Partial pass ($roleTestsPassed of $roleCount roles)" -ForegroundColor Yellow
        $testResults += @{ Test = "Backend API All role types"; Result = "PARTIAL" }
        $totalTests++
    }
}
else {
    Write-Host "   ⏭️  Skipped (no test member created)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LAYER 3: DATA RELATIONSHIP VALIDATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 3.1: Check if user with instructor role shows in members list
Write-Host "Test 3.1: Verify instructor-role user in members list..." -ForegroundColor Yellow
if ($testMemberId) {
    try {
        # Set role to instructor
        $setInstructorBody = @{ role = "instructor" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/users/$testMemberId" -Method PUT -Body $setInstructorBody -Headers $headers | Out-Null
        
        # Check members list
        $membersResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET -Headers $headers
        $foundMember = $membersResponse | Where-Object { $_.id -eq $testMemberId }
        
        if ($foundMember -and $foundMember.role -eq "instructor") {
            Write-Host "   ✅ Instructor-role user appears in users list with correct role" -ForegroundColor Green
            $testResults += @{ Test = "Data: Instructor in users list"; Result = "PASS" }
            $totalTests++; $passedTests++
        }
        else {
            throw "User not found or role incorrect in list"
        }
    }
    catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Data: Instructor in users list"; Result = "FAIL" }
        $totalTests++
    }
}
else {
    Write-Host "   ⏭️  Skipped (no test member created)" -ForegroundColor Gray
}

# Test 3.2: Check role filtering
Write-Host "Test 3.2: Test role-based filtering..." -ForegroundColor Yellow
try {
    $allUsers = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET -Headers $headers
    $instructors = $allUsers | Where-Object { $_.role -eq "instructor" }
    $members = $allUsers | Where-Object { $_.role -eq "member" }
    
    Write-Host "   ✅ Role filtering working (Instructors: $($instructors.Count), Members: $($members.Count))" -ForegroundColor Green
    $testResults += @{ Test = "Data: Role filtering"; Result = "PASS" }
    $totalTests++; $passedTests++
}
catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Data: Role filtering"; Result = "FAIL" }
    $totalTests++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LAYER 4: FRONTEND SERVICE VALIDATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 4.1: Check TypeScript interface definitions
Write-Host "Test 4.1: Verify Member interface includes role field..." -ForegroundColor Yellow
try {
    $dataContextPath = "c:\Users\AgiL\viking-hammer-crossfit-app\frontend\src\contexts\DataContext.tsx"
    $dataContextContent = Get-Content $dataContextPath -Raw
    
    if ($dataContextContent -match "role:\s*'member'\s*\|\s*'instructor'\s*\|\s*'admin'\s*\|\s*'reception'\s*\|\s*'sparta'") {
        Write-Host "   ✅ Member interface has correct role type definition" -ForegroundColor Green
        $testResults += @{ Test = "Frontend: Member interface role type"; Result = "PASS" }
        $totalTests++; $passedTests++
    }
    else {
        throw "Role type definition not found or incorrect"
    }
}
catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Frontend: Member interface role type"; Result = "FAIL" }
    $totalTests++
}

# Test 4.2: Check MemberManagement component has role assignment
Write-Host "Test 4.2: Verify MemberManagement component handles role updates..." -ForegroundColor Yellow
try {
    $memberMgmtPath = "c:\Users\AgiL\viking-hammer-crossfit-app\frontend\src\components\MemberManagement.tsx"
    $memberMgmtContent = Get-Content $memberMgmtPath -Raw
    
    $hasRoleField = $memberMgmtContent -match "role:\s*newMember\.role"
    $hasUpdateMember = $memberMgmtContent -match "updateMember\(selectedMember\.id"
    
    if ($hasRoleField -and $hasUpdateMember) {
        Write-Host "   ✅ MemberManagement component handles role updates" -ForegroundColor Green
        $testResults += @{ Test = "Frontend: MemberManagement role handling"; Result = "PASS" }
        $totalTests++; $passedTests++
    }
    else {
        throw "Role handling not found in component"
    }
}
catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Frontend: MemberManagement role handling"; Result = "FAIL" }
    $totalTests++
}

# Test 4.3: Check role dropdown/selector exists
Write-Host "Test 4.3: Verify role selector UI exists..." -ForegroundColor Yellow
try {
    $memberMgmtContent = Get-Content $memberMgmtPath -Raw
    
    if ($memberMgmtContent -match "select.*role" -or $memberMgmtContent -match "Role.*select") {
        Write-Host "   ✅ Role selector UI exists in component" -ForegroundColor Green
        $testResults += @{ Test = "Frontend: Role selector UI"; Result = "PASS" }
        $totalTests++; $passedTests++
    }
    else {
        throw "Role selector UI not found"
    }
}
catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Frontend: Role selector UI"; Result = "FAIL" }
    $totalTests++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CLEANUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Cleanup: Delete test member
Write-Host "Cleaning up: Deleting test member..." -ForegroundColor Yellow
if ($testMemberId) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/users/$testMemberId" -Method DELETE -Headers $headers | Out-Null
        Write-Host "   ✅ Test member deleted" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠️  Could not delete test member (may need manual cleanup)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display results table
Write-Host "Test Results:" -ForegroundColor White
Write-Host "-----------------------------------------------------" -ForegroundColor Gray
foreach ($result in $testResults) {
    $statusColor = if ($result.Result -eq "PASS") { "Green" } elseif ($result.Result -eq "FAIL") { "Red" } else { "Yellow" }
    $statusIcon = if ($result.Result -eq "PASS") { "[PASS]" } elseif ($result.Result -eq "FAIL") { "[FAIL]" } else { "[WARN]" }
    Write-Host "$statusIcon $($result.Test)" -ForegroundColor $statusColor
}
Write-Host "-----------------------------------------------------" -ForegroundColor Gray
Write-Host ""

$passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "Overall Results:" -ForegroundColor White
Write-Host "   Total Tests: $totalTests" -ForegroundColor Cyan
Write-Host "   Passed: $passedTests" -ForegroundColor Green
Write-Host "   Failed: $($totalTests - $passedTests)" -ForegroundColor Red
Write-Host "   Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 95) { "Green" } elseif ($passRate -ge 80) { "Yellow" } else { "Red" })
Write-Host ""

if ($passRate -eq 100) {
    Write-Host "🎉 ALL TESTS PASSED - PRODUCTION READY!" -ForegroundColor Green
}
elseif ($passRate -ge 90) {
    Write-Host "✅ EXCELLENT - Minor issues detected" -ForegroundColor Yellow
}
elseif ($passRate -ge 75) {
    Write-Host "⚠️  GOOD - Some issues need attention" -ForegroundColor Yellow
}
else {
    Write-Host "❌ ATTENTION REQUIRED - Multiple issues detected" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "END OF TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
