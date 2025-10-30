# 🔧 COMPLETE FIX & IMPLEMENTATION PLAN

## Viking Hammer CrossFit - Path to 100% Deployment Readiness

**Current Status:** 87% Ready  
**Target Status:** 100% Ready  
**Estimated Time:** 2-3 days  
**Priority:** Fix critical blockers → Fix warnings → Optimize

---

## 📋 EXECUTIVE SUMMARY

This plan addresses **all 13 issues** identified in the comprehensive testing report, organized by priority and layer. Each fix includes:

- **What to change** (exact file and line numbers)
- **Why it's needed** (business requirement)
- **How to implement** (code snippets)
- **How to test** (verification steps)

---

## 🎯 IMPLEMENTATION PHASES

### **PHASE 1: CRITICAL BLOCKERS** (Day 1 - 8 hours)

Fix issues that prevent core functionality from working.

### **PHASE 2: SECURITY & PERMISSIONS** (Day 2 - 6 hours)

Fix authorization and access control issues.

### **PHASE 3: OPTIMIZATIONS & POLISH** (Day 2-3 - 4 hours)

Improve code quality and fix minor issues.

### **PHASE 4: TESTING & VERIFICATION** (Day 3 - 2 hours)

End-to-end testing of all fixed functionality.

---

# 🔴 PHASE 1: CRITICAL BLOCKERS

## BLOCKER 1: INSTRUCTOR ROLE - CLASS CRUD FUNCTIONALITY

**Status:** ❌ 40% Complete (Non-functional)  
**Impact:** HIGH - Instructor role completely unusable  
**Estimated Time:** 4 hours

---

### 1.1 DATABASE LAYER - Add Ownership Tracking

#### **File:** `infra/supabase/migrations/20251025_add_class_ownership.sql` (NEW)

```sql
-- Migration: Add ownership tracking to classes table
-- Date: October 25, 2024
-- Purpose: Enable instructor-specific class management

-- Add created_by column to track class ownership
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_classes_created_by ON public.classes(created_by);

-- Backfill existing classes (set to first admin/sparta user)
UPDATE public.classes
SET created_by = (
  SELECT id FROM public.users_profile
  WHERE role IN ('sparta', 'admin')
  LIMIT 1
)
WHERE created_by IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.classes.created_by IS 'User ID of the instructor/admin who created this class';
```

**Why:** Without `created_by`, we cannot enforce "instructor can edit only their own classes"

**How to Apply:**

```powershell
# Run in Supabase SQL Editor or via migration script
node infra/supabase/run_sql.js infra/supabase/migrations/20251025_add_class_ownership.sql
```

**Verification:**

```sql
-- Check column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'classes' AND column_name = 'created_by';

-- Should return: created_by | uuid
```

---

### 1.2 DATABASE LAYER - RLS Policies for Classes

#### **File:** `infra/supabase/policies/classes_rls.sql` (NEW)

```sql
-- RLS Policies for Classes Table
-- Enables instructor-specific ownership and admin override

-- Enable RLS on classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view classes (public information)
CREATE POLICY "classes_select_public" ON public.classes
  FOR SELECT
  USING (true);

-- Policy 2: Instructors and admins can create classes
-- When instructor creates, they become the owner
CREATE POLICY "classes_insert_auth" ON public.classes
  FOR INSERT
  WITH CHECK (
    auth.role() IN ('admin', 'reception', 'sparta', 'instructor') OR
    auth.role() = 'service_role'
  );

-- Policy 3: Instructors can update ONLY their own classes
-- Admins (sparta, reception) can update any class
CREATE POLICY "classes_update_owner_or_admin" ON public.classes
  FOR UPDATE
  USING (
    created_by::text = auth.uid() OR
    auth.role() IN ('admin', 'reception', 'sparta') OR
    auth.role() = 'service_role'
  );

-- Policy 4: Only admin team can delete classes
-- Instructors CANNOT delete any classes (per requirement)
CREATE POLICY "classes_delete_admin_only" ON public.classes
  FOR DELETE
  USING (
    auth.role() IN ('admin', 'reception', 'sparta') OR
    auth.role() = 'service_role'
  );

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_created_by_status ON public.classes(created_by, status);
```

**Why:** RLS policies enforce database-level security so even if API is bypassed, database protects data

**How to Apply:**

```powershell
node infra/supabase/run_sql.js infra/supabase/policies/classes_rls.sql
```

**Verification:**

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'classes';
-- Should return: classes | true

-- List all policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'classes';
-- Should return 4 policies
```

---

### 1.3 BACKEND LAYER - Update API Permissions

#### **File:** `backend-server.js`

**Change 1: Allow Instructors to Create Classes**

**Line 370-375** (POST /api/classes endpoint)

**BEFORE:**

```javascript
app.post(
  '/api/classes',
  authenticate,
  isAdmin,  // ❌ Blocks instructors
  asyncHandler(async (req, res) => {
```

**AFTER:**

```javascript
app.post(
  '/api/classes',
  authenticate,
  authorize('sparta', 'reception', 'instructor'),  // ✅ Allows instructors
  asyncHandler(async (req, res) => {
    // Add created_by field from authenticated user
    const classData = {
      ...req.body,
      created_by: req.user.userId  // Track ownership
    };

    const result = await classService.createClass(classData);
```

---

**Change 2: Allow Instructors to Update Their Own Classes**

**Line 388-393** (PUT /api/classes/:id endpoint)

**BEFORE:**

```javascript
app.put(
  '/api/classes/:id',
  authenticate,
  isAdmin,  // ❌ Blocks instructors
  asyncHandler(async (req, res) => {
```

**AFTER:**

```javascript
app.put(
  '/api/classes/:id',
  authenticate,
  authorize('sparta', 'reception', 'instructor'),  // ✅ Allows instructors
  asyncHandler(async (req, res) => {
    // Ownership validation handled in classService
    const result = await classService.updateClass(
      req.params.id,
      req.body,
      req.user.userId,  // Pass userId for ownership check
      req.user.role     // Pass role for admin override
    );
```

---

**Change 3: Allow Admin Team (Not Just Sparta) to Delete Classes**

**Line 405-410** (DELETE /api/classes/:id endpoint)

**BEFORE:**

```javascript
app.delete(
  '/api/classes/:id',
  authenticate,
  isSpartaOnly,  // ❌ Too restrictive, requirement says "Admin Team"
  asyncHandler(async (req, res) => {
```

**AFTER:**

```javascript
app.delete(
  '/api/classes/:id',
  authenticate,
  isAdmin,  // ✅ Allows sparta AND reception (admin team)
  asyncHandler(async (req, res) => {
```

**Why:** Requirement states "Admin Team can delete" = Sparta OR Reception, not just Sparta

---

### 1.4 BACKEND LAYER - Add Ownership Validation

#### **File:** `services/classService.js`

**Change 1: Update createClass to Track Ownership**

**Line 175-220** (createClass function)

**BEFORE:**

```javascript
async function createClass(classData) {
  try {
    const { instructorIds, schedule_slots, ...classFields } = classData;

    const { data, error } = await supabase
      .from('classes')
      .insert([classFields])  // ❌ No created_by field
      .select()
      .single();
```

**AFTER:**

```javascript
async function createClass(classData) {
  try {
    const { instructorIds, schedule_slots, created_by, ...classFields } = classData;

    // Ensure created_by is set (from API or fallback)
    const classWithOwner = {
      ...classFields,
      created_by: created_by || null  // ✅ Track ownership
    };

    const { data, error } = await supabase
      .from('classes')
      .insert([classWithOwner])
      .select()
      .single();
```

---

**Change 2: Add Ownership Validation to updateClass**

**Line 227-260** (updateClass function signature and logic)

**BEFORE:**

```javascript
async function updateClass(classId, updates) {
  try {
    const { instructorIds, schedule_slots, id, created_at, updated_at, ...allowedUpdates } =
      updates;

    const { data, error } = await supabase
      .from('classes')
      .update({ ...allowedUpdates, updated_at: new Date() })
      .eq('id', classId)  // ❌ No ownership check
      .select()
      .single();
```

**AFTER:**

```javascript
async function updateClass(classId, updates, requestingUserId, requestingUserRole) {
  try {
    // Step 1: Check ownership if user is instructor
    if (requestingUserRole === 'instructor') {
      const { data: classData, error: fetchError } = await supabase
        .from('classes')
        .select('created_by')
        .eq('id', classId)
        .single();

      if (fetchError) {
        return { error: 'Class not found', status: 404 };
      }

      // Verify instructor owns this class
      if (classData.created_by !== requestingUserId) {
        return {
          error: 'Forbidden: You can only edit your own classes',
          status: 403,
          code: 'NOT_OWNER'
        };
      }
    }
    // Admins (sparta, reception) can edit any class (no ownership check)

    // Step 2: Proceed with update
    const { instructorIds, schedule_slots, id, created_at, updated_at, created_by, ...allowedUpdates } =
      updates;

    const { data, error } = await supabase
      .from('classes')
      .update({ ...allowedUpdates, updated_at: new Date() })
      .eq('id', classId)
      .select()
      .single();
```

---

**Change 3: Export Updated Function Signature**

**Line 330-335** (module.exports)

**BEFORE:**

```javascript
module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass, // ❌ Old signature
  deleteClass,
};
```

**AFTER:**

```javascript
module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass, // ✅ Now accepts userId and role parameters
  deleteClass,
};
```

---

### 1.5 FRONTEND LAYER - Filter Classes by Ownership

#### **File:** `frontend/src/components/ClassManagement.tsx`

**Change: Filter Classes for Instructor Role**

**Line 148-165** (useEffect that loads classes)

**BEFORE:**

```javascript
useEffect(() => {
  const loadClasses = async () => {
    try {
      const fetchedClasses = await classService.getAll();
      setClasses(fetchedClasses); // ❌ Shows ALL classes to everyone
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  loadClasses();
}, []);
```

**AFTER:**

```javascript
useEffect(() => {
  const loadClasses = async () => {
    try {
      const fetchedClasses = await classService.getAll();

      // Filter classes for instructor role
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = currentUser.role;
      const userId = currentUser.id;

      if (userRole === 'instructor') {
        // Instructors see only their own classes
        const myClasses = fetchedClasses.filter((cls: any) => cls.created_by === userId);
        setClasses(myClasses);
        console.log(
          `Instructor view: Showing ${myClasses.length} of ${fetchedClasses.length} classes`,
        );
      } else {
        // Admins see all classes
        setClasses(fetchedClasses);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  loadClasses();
}, []);
```

**Why:** Instructors should only see classes they created, not all gym classes

---

### 1.6 FRONTEND LAYER - Add Created By Indicator

#### **File:** `frontend/src/components/ClassManagement.tsx`

**Change: Show Ownership in Class Card**

**Line 790-810** (inside class card rendering)

**Add after class name display:**

```javascript
<div className="class-header">
  <h3>{gymClass.name}</h3>
  {gymClass.created_by && (
    <span className="created-by-badge">
      {gymClass.created_by === currentUserId ? '🎯 Your Class' : '👤 Admin Created'}
    </span>
  )}
</div>
```

**Add CSS:**

```css
.created-by-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
}

.created-by-badge:contains('Your Class') {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

---

### 1.7 TESTING BLOCKER 1 FIX

**Test 1: Instructor Creates Class**

```javascript
// Login as instructor
POST /api/auth/signin
{ "email": "instructor@gym.com", "password": "test123" }

// Create class
POST /api/classes
Authorization: Bearer {instructor_token}
{
  "name": "Morning Yoga",
  "description": "Relaxing yoga session",
  "duration": 60,
  "max_capacity": 15,
  "category": "Yoga"
}

// Expected: 201 Created, class.created_by = instructor_id
// Before Fix: 403 Forbidden (isAdmin blocked)
// After Fix: ✅ 201 Created
```

**Test 2: Instructor Edits Own Class**

```javascript
PUT /api/classes/{class_id_created_by_instructor}
Authorization: Bearer {instructor_token}
{ "description": "Updated description" }

// Expected: 200 OK
// Before Fix: 403 Forbidden
// After Fix: ✅ 200 OK
```

**Test 3: Instructor Edits Other's Class**

```javascript
PUT /api/classes/{class_id_created_by_admin}
Authorization: Bearer {instructor_token}
{ "description": "Trying to edit admin's class" }

// Expected: 403 Forbidden "You can only edit your own classes"
// Before Fix: 403 Forbidden (isAdmin blocked)
// After Fix: ✅ 403 Forbidden with ownership message
```

**Test 4: Instructor Tries to Delete Class**

```javascript
DELETE /api/classes/{class_id_created_by_instructor}
Authorization: Bearer {instructor_token}

// Expected: 403 Forbidden (only admin team can delete)
// Before Fix: 403 Forbidden (isSpartaOnly)
// After Fix: ✅ 403 Forbidden (isAdmin, correct behavior)
```

**Test 5: Reception Deletes Class**

```javascript
DELETE /api/classes/{class_id}
Authorization: Bearer {reception_token}

// Expected: 200 OK (admin team can delete)
// Before Fix: 403 Forbidden (isSpartaOnly blocked reception)
// After Fix: ✅ 200 OK
```

**Test 6: UI Filtering**

```javascript
// Login as instructor with 2 own classes + 10 admin classes in DB
// Open ClassManagement component

// Expected: Shows only 2 classes
// Before Fix: Shows all 12 classes
// After Fix: ✅ Shows 2 classes with "🎯 Your Class" badge
```

---

## BLOCKER 2: MEMBER NAME EDITING BYPASS

**Status:** ⚠️ 70% Complete (Frontend blocks, backend allows)  
**Impact:** MEDIUM - Security bypass via API  
**Estimated Time:** 1 hour

---

### 2.1 BACKEND LAYER - Add Name Editing Validation

#### **File:** `backend-server.js`

**Change: Validate Name Fields in Update Endpoint**

**Line 295-310** (PUT /api/users/:id endpoint)

**BEFORE:**

```javascript
app.put(
  '/api/users/:id',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await userService.updateUser(req.params.id, req.body);
    // ❌ No validation for name fields
```

**AFTER:**

```javascript
app.put(
  '/api/users/:id',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    // Admin can update everything (no restrictions)
    const result = await userService.updateUser(req.params.id, req.body);
```

**Add New Endpoint for Member Self-Update:**

**After Line 310, ADD:**

```javascript
/**
 * PUT /api/users/me - Update own profile (members)
 * Members can update most fields EXCEPT first/last name
 */
app.put(
  '/api/users/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, ...allowedUpdates } = req.body;

    // Check if member is trying to update name fields
    if ((firstName || lastName) && !['admin', 'reception', 'sparta'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Only admin can edit first and last name',
        code: 'NAME_EDIT_RESTRICTED',
        message: 'Please contact reception to update your name',
      });
    }

    // If admin, allow name updates
    const updates =
      req.user.role === 'admin' || req.user.role === 'reception' || req.user.role === 'sparta'
        ? { ...allowedUpdates, firstName, lastName }
        : allowedUpdates;

    const result = await userService.updateUser(req.user.userId, updates);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result);
  }),
);
```

**Why:** Backend validation prevents bypass via API calls even if frontend is modified

---

### 2.2 FRONTEND LAYER - Update API Calls

#### **File:** `frontend/src/services/memberService.ts`

**Change: Use Correct Endpoint for Self-Update**

**Line 120-150** (updateMember function for self-update)

**ADD new function:**

```typescript
/**
 * Update own profile (for members)
 * Uses /api/users/me endpoint which enforces name restrictions
 */
export async function updateOwnProfile(updates: UpdateMemberData): Promise<Member> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (response.status === 401) {
      handle401Error();
      throw new Error('Session expired');
    }

    if (response.status === 403) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Cannot update name fields');
    }

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}
```

---

### 2.3 FRONTEND LAYER - Use New Endpoint in MyProfile

#### **File:** `frontend/src/components/MyProfile.tsx`

**Change: Call updateOwnProfile Instead of Direct Update**

**Line 250-280** (handleSaveEmergency or similar save function)

**BEFORE:**

```javascript
const handleSave = async () => {
  try {
    await updateUserProfile(user.id, updates);  // ❌ Uses admin endpoint
    // ...
  }
};
```

**AFTER:**

```javascript
const handleSave = async () => {
  try {
    // Use appropriate endpoint based on role
    const currentUserRole = user?.role || 'member';

    if (currentUserRole === 'member' || currentUserRole === 'instructor') {
      await updateOwnProfile(updates);  // ✅ Uses restricted endpoint
    } else {
      await updateUserProfile(user.id, updates);  // Admin endpoint
    }

    setSuccessMessage('Profile updated successfully');
  } catch (error: any) {
    if (error.message.includes('Cannot update name')) {
      setErrorMessage('Name can only be updated by admin team');
    } else {
      setErrorMessage('Failed to update profile');
    }
  }
};
```

---

### 2.4 TESTING BLOCKER 2 FIX

**Test 1: Member Updates Phone (Allowed)**

```javascript
PUT /api/users/me
Authorization: Bearer {member_token}
{ "phone": "+994501234567" }

// Expected: 200 OK
// After Fix: ✅ 200 OK
```

**Test 2: Member Updates Name (Blocked)**

```javascript
PUT /api/users/me
Authorization: Bearer {member_token}
{ "firstName": "HackedName" }

// Expected: 403 Forbidden with message
// Before Fix: 200 OK (bypassed frontend)
// After Fix: ✅ 403 Forbidden "Only admin can edit first and last name"
```

**Test 3: Admin Updates Name (Allowed)**

```javascript
PUT /api/users/me
Authorization: Bearer {admin_token}
{ "firstName": "UpdatedName" }

// Expected: 200 OK
// After Fix: ✅ 200 OK
```

**Test 4: Browser DevTools Bypass Attempt**

```javascript
// 1. Login as member
// 2. Open browser DevTools → Console
// 3. Remove readonly attribute:
document.querySelector('input[name="firstName"]').removeAttribute('readonly');

// 4. Edit name field
// 5. Submit form

// Expected: API returns 403, error message shown
// Before Fix: Name updated in database ❌
// After Fix: ✅ 403 error, name NOT updated
```

---

## BLOCKER 3: SPARTA-ONLY RESTRICTIONS MISSING

**Status:** ⚠️ 75-85% Complete (No enforcement)  
**Impact:** MEDIUM - Reception has excessive permissions  
**Estimated Time:** 3 hours

---

### 3.1 Sparta-Only: Instructor Role Assignment

#### **File:** `services/userService.js`

**Change: Validate Instructor Role Assignment**

**Line 130-180** (createUser function)

**ADD validation before user creation:**

```javascript
async function createUser(userData) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      role = 'member',  // ← Check this field
      status,
      membershipType,
      company,
      joinDate,
      requestingUserRole  // ← NEW: Pass from API
    } = userData;

    // CRITICAL: Validate instructor role assignment
    if (role === 'instructor' && requestingUserRole !== 'sparta') {
      return {
        error: 'Only Sparta can assign instructor role',
        status: 403,
        code: 'SPARTA_ONLY_INSTRUCTOR'
      };
    }

    // Continue with existing user creation logic...
```

---

#### **File:** `backend-server.js`

**Change: Pass Requesting User Role to Service**

**Line 261-270** (POST /api/users endpoint)

**BEFORE:**

```javascript
app.post(
  '/api/users',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const result = await userService.createUser(req.body);
    // ❌ Doesn't pass requestingUserRole
```

**AFTER:**

```javascript
app.post(
  '/api/users',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    // Pass requesting user's role for validation
    const userData = {
      ...req.body,
      requestingUserRole: req.user.role  // ✅ Pass role for validation
    };

    const result = await userService.createUser(userData);
```

**Also update PUT /api/users/:id for role changes:**

**Line 297-305**

```javascript
app.put(
  '/api/users/:id',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    // Validate role changes
    if (req.body.role === 'instructor' && req.user.role !== 'sparta') {
      return res.status(403).json({
        error: 'Only Sparta can assign instructor role',
        code: 'SPARTA_ONLY_INSTRUCTOR'
      });
    }

    const result = await userService.updateUser(req.params.id, req.body);
```

---

### 3.2 Sparta-Only: Membership Type CRUD

**Option A: Add Backend API with Sparta-Only Middleware**

#### **File:** `backend-server.js`

**ADD after instructors endpoints (around Line 500):**

```javascript
// ==================== MEMBERSHIP PLANS (SPARTA ONLY) ====================

/**
 * GET /api/membership-plans - Get all membership plans
 */
app.get(
  '/api/membership-plans',
  authenticate,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch membership plans' });
    }

    res.json({ success: true, data });
  }),
);

/**
 * POST /api/membership-plans - Create membership plan (SPARTA ONLY)
 */
app.post(
  '/api/membership-plans',
  authenticate,
  isSpartaOnly, // ✅ Restrict to Sparta
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('membership_plans')
      .insert([req.body])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create membership plan' });
    }

    res.status(201).json({ success: true, data });
  }),
);

/**
 * PUT /api/membership-plans/:id - Update membership plan (SPARTA ONLY)
 */
app.put(
  '/api/membership-plans/:id',
  authenticate,
  isSpartaOnly,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('membership_plans')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update membership plan' });
    }

    res.json({ success: true, data });
  }),
);

/**
 * DELETE /api/membership-plans/:id - Delete membership plan (SPARTA ONLY)
 */
app.delete(
  '/api/membership-plans/:id',
  authenticate,
  isSpartaOnly,
  asyncHandler(async (req, res) => {
    const { error } = await supabase.from('membership_plans').delete().eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete membership plan' });
    }

    res.json({ success: true, message: 'Membership plan deleted' });
  }),
);
```

---

**Option B: Add RLS Policies (Alternative/Additional)**

#### **File:** `infra/supabase/policies/membership_plans_rls.sql` (NEW)

```sql
-- RLS Policies for Membership Plans Table
-- Only Sparta can create/update/delete membership types

-- Enable RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can view membership plans
CREATE POLICY "membership_plans_select_all" ON public.membership_plans
  FOR SELECT
  USING (true);

-- Policy 2: Only Sparta can insert
CREATE POLICY "membership_plans_insert_sparta" ON public.membership_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id::text = auth.uid()
      AND role = 'sparta'
    ) OR
    auth.role() = 'service_role'
  );

-- Policy 3: Only Sparta can update
CREATE POLICY "membership_plans_update_sparta" ON public.membership_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id::text = auth.uid()
      AND role = 'sparta'
    ) OR
    auth.role() = 'service_role'
  );

-- Policy 4: Only Sparta can delete
CREATE POLICY "membership_plans_delete_sparta" ON public.membership_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id::text = auth.uid()
      AND role = 'sparta'
    ) OR
    auth.role() = 'service_role'
  );
```

---

### 3.3 Frontend - Update Service to Use Backend API

#### **File:** `frontend/src/services/membershipPlanService.ts` (NEW)

```typescript
// Replace direct Supabase calls with backend API calls

const API_BASE_URL = 'http://localhost:4001/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

export async function fetchMembershipPlans() {
  const response = await fetch(`${API_BASE_URL}/membership-plans`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch membership plans');
  }

  const data = await response.json();
  return data.data;
}

export async function createMembershipPlan(planData: any) {
  const response = await fetch(`${API_BASE_URL}/membership-plans`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(planData),
  });

  if (response.status === 403) {
    throw new Error('Only Sparta can create membership plans');
  }

  if (!response.ok) {
    throw new Error('Failed to create membership plan');
  }

  const data = await response.json();
  return data.data;
}

export async function updateMembershipPlan(id: string, updates: any) {
  const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (response.status === 403) {
    throw new Error('Only Sparta can update membership plans');
  }

  if (!response.ok) {
    throw new Error('Failed to update membership plan');
  }

  const data = await response.json();
  return data.data;
}

export async function deleteMembershipPlan(id: string) {
  const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (response.status === 403) {
    throw new Error('Only Sparta can delete membership plans');
  }

  if (!response.ok) {
    throw new Error('Failed to delete membership plan');
  }
}
```

---

### 3.4 Frontend - Update MembershipManager to Use New Service

#### **File:** `frontend/src/components/MembershipManager.tsx`

**Line 1-15** (imports)

**BEFORE:**

```typescript
import {
  fetchMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
} from '../services/supabaseService'; // ❌ Direct Supabase access
```

**AFTER:**

```typescript
import {
  fetchMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
} from '../services/membershipPlanService'; // ✅ Uses backend API
```

**Add Error Handling:**

**Line 150-180** (handleCreatePlan function)

**ADD error handling:**

```typescript
const handleCreatePlan = async () => {
  try {
    const newPlan = await createMembershipPlan(planFormData);
    setMembershipPlans([...membershipPlans, newPlan]);
    setShowAddPlanModal(false);
    alert('✅ Membership plan created successfully');
  } catch (error: any) {
    if (error.message.includes('Only Sparta')) {
      alert('❌ Access Denied: Only Sparta can create membership plans');
    } else {
      alert('❌ Failed to create membership plan');
    }
  }
};
```

---

### 3.5 Frontend - Hide MembershipManager for Reception

#### **File:** `frontend/src/components/Reception.tsx`

**Change: Remove Membership Manager Access**

**Line 180-220** (Navigation buttons or menu)

**BEFORE:**

```tsx
<button onClick={() => setCurrentView('membership')}>💎 Membership Manager</button>
```

**AFTER:**

```tsx
{
  /* Removed: Membership Manager - Sparta-only feature */
}
{
  /* Reception can view memberships but not manage plans */
}
```

**Same change in:** `frontend/src/components/Sparta.tsx` - Keep the button

---

### 3.6 TESTING BLOCKER 3 FIX

**Test 1: Reception Assigns Instructor Role (Should Fail)**

```javascript
POST /api/users
Authorization: Bearer {reception_token}
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@gym.com",
  "role": "instructor"  // ← Trying to assign instructor
}

// Expected: 403 Forbidden "Only Sparta can assign instructor role"
// Before Fix: 201 Created (no restriction)
// After Fix: ✅ 403 Forbidden
```

**Test 2: Sparta Assigns Instructor Role (Should Pass)**

```javascript
POST /api/users
Authorization: Bearer {sparta_token}
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@gym.com",
  "role": "instructor"
}

// Expected: 201 Created
// After Fix: ✅ 201 Created
```

**Test 3: Reception Creates Membership Plan (Should Fail)**

```javascript
POST /api/membership-plans
Authorization: Bearer {reception_token}
{
  "name": "Premium Plan",
  "price": 100
}

// Expected: 403 Forbidden "Sparta-level access required"
// Before Fix: 201 Created (if using Supabase direct)
// After Fix: ✅ 403 Forbidden
```

**Test 4: Sparta Creates Membership Plan (Should Pass)**

```javascript
POST /api/membership-plans
Authorization: Bearer {sparta_token}
{
  "name": "Premium Plan",
  "price": 100
}

// Expected: 201 Created
// After Fix: ✅ 201 Created
```

**Test 5: Reception UI Access**

```javascript
// Login as Reception
// Navigate to dashboard

// Expected: NO "Membership Manager" button visible
// Before Fix: Button visible, full access
// After Fix: ✅ Button hidden, no access
```

---

# 🟡 PHASE 2: OPTIMIZATIONS & POLISH

## OPTIMIZATION 1: BIRTHDAY CHECKBOX SELECTION

**Status:** ⚠️ 95% Complete (Works but fragile code)  
**Impact:** LOW - Code quality issue  
**Estimated Time:** 30 minutes

---

### 1.1 Frontend - Replace nth-of-type Selectors with Refs

#### **File:** `frontend/src/components/UpcomingBirthdays.tsx`

**Line 25-35** (Add refs)

**ADD at component top:**

```typescript
const emailCheckboxRef = useRef<HTMLInputElement>(null);
const smsCheckboxRef = useRef<HTMLInputElement>(null);
const whatsappCheckboxRef = useRef<HTMLInputElement>(null);
const inAppCheckboxRef = useRef<HTMLInputElement>(null);
```

---

**Line 259-263** (sendBirthdayMessage function)

**BEFORE:**

```typescript
const emailCheckbox = document.querySelector(
  'input[type="checkbox"]:nth-of-type(1)',
) as HTMLInputElement;
const smsCheckbox = document.querySelector(
  'input[type="checkbox"]:nth-of-type(2)',
) as HTMLInputElement;
const whatsappCheckbox = document.querySelector(
  'input[type="checkbox"]:nth-of-type(3)',
) as HTMLInputElement;
const inAppCheckbox = document.querySelector(
  'input[type="checkbox"]:nth-of-type(4)',
) as HTMLInputElement;
```

**AFTER:**

```typescript
const emailCheckbox = emailCheckboxRef.current;
const smsCheckbox = smsCheckboxRef.current;
const whatsappCheckbox = whatsappCheckboxRef.current;
const inAppCheckbox = inAppCheckboxRef.current;
```

---

**Line 560-585** (Checkbox rendering in modal)

**BEFORE:**

```tsx
<label className="delivery-option">
  <input type="checkbox" defaultChecked />
  📧 Email ({selectedMember.email})
</label>
```

**AFTER:**

```tsx
<label className="delivery-option">
  <input
    ref={emailCheckboxRef}
    type="checkbox"
    defaultChecked
    id="email-checkbox"
  />
  📧 Email ({selectedMember.email})
</label>

<label className="delivery-option">
  <input
    ref={smsCheckboxRef}
    type="checkbox"
    id="sms-checkbox"
  />
  📱 SMS ({selectedMember.phone})
</label>

<label className="delivery-option">
  <input
    ref={whatsappCheckboxRef}
    type="checkbox"
    id="whatsapp-checkbox"
  />
  💬 WhatsApp ({selectedMember.phone})
</label>

<label className="delivery-option">
  <input
    ref={inAppCheckboxRef}
    type="checkbox"
    id="inapp-checkbox"
  />
  🔔 In-App Notification
</label>
```

**Why:** Using refs is more maintainable and won't break if form structure changes

---

## OPTIMIZATION 2: ANNOUNCEMENT EXPIRY CLARIFICATION

**Status:** ⚠️ Ambiguous requirement  
**Impact:** LOW - Business logic clarification  
**Estimated Time:** 15 minutes discussion + 15 minutes code

---

### 2.1 Clarify with Stakeholder

**Question:** "Should announcements automatically expire after 30 days, or remain indefinitely unless manually set?"

**Current Behavior:** Announcements remain indefinitely unless `expires_at` is manually set

**Option A: Auto-expiry (matches "30 days" requirement)**
**Option B: Manual expiry only (current implementation)**

**If choosing Option A:**

#### **File:** `backend-server.js`

**Line 1220-1240** (POST /api/announcements)

**ADD auto-expiry logic:**

```javascript
app.post(
  '/api/announcements',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const announcementData = {
      ...req.body,
      created_by: req.user.userId,
    };

    // Auto-set expiry to 30 days if not provided
    if (!announcementData.expires_at) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);  // 30 days from now
      announcementData.expires_at = expiryDate.toISOString();
    }

    const result = await announcementService.createAnnouncement(announcementData);
```

**Frontend adjustment:**

#### **File:** `frontend/src/hooks/useAnnouncements.ts`

**ADD filtering by expiry:**

```typescript
const loadAnnouncements = async () => {
  // ... existing fetch logic

  // Filter out expired announcements
  const now = new Date();
  const activeAnnouncements = announcements.filter((a) => {
    if (!a.expires_at) return true; // No expiry = always show
    return new Date(a.expires_at) > now; // Show if not expired
  });

  setAllAnnouncements(activeAnnouncements);
};
```

---

# 🧪 PHASE 3: COMPREHENSIVE TESTING

## Test Suite 1: Instructor Role Full Flow

**Test Scenario:** Instructor creates, edits, and attempts to delete class

```javascript
// Step 1: Login as Instructor
POST /api/auth/signin
{ "email": "instructor@gym.com", "password": "pass123" }
// Save token

// Step 2: Create class (should work)
POST /api/classes
Headers: { Authorization: Bearer {token} }
Body: {
  "name": "Advanced Boxing",
  "description": "High-intensity boxing",
  "duration": 90,
  "max_capacity": 12,
  "category": "Boxing"
}
// ✅ Expected: 201 Created, class.created_by = instructor.id

// Step 3: View own classes in UI
// Open ClassManagement component
// ✅ Expected: Shows only "Advanced Boxing" (not other instructors' classes)

// Step 4: Edit own class (should work)
PUT /api/classes/{class_id}
Headers: { Authorization: Bearer {token} }
Body: { "description": "Updated description" }
// ✅ Expected: 200 OK

// Step 5: Try to edit another instructor's class (should fail)
PUT /api/classes/{other_instructor_class_id}
Headers: { Authorization: Bearer {token} }
Body: { "description": "Hacking" }
// ✅ Expected: 403 Forbidden "You can only edit your own classes"

// Step 6: Try to delete own class (should fail - admin only)
DELETE /api/classes/{class_id}
Headers: { Authorization: Bearer {token} }
// ✅ Expected: 403 Forbidden

// Step 7: Admin deletes class (should work)
// Login as Sparta or Reception
DELETE /api/classes/{class_id}
Headers: { Authorization: Bearer {admin_token} }
// ✅ Expected: 200 OK, class deleted
```

---

## Test Suite 2: Member Name Editing Restriction

```javascript
// Step 1: Login as Member
POST /api/auth/signin
{ "email": "member@gym.com", "password": "pass123" }

// Step 2: Try to update name via API (should fail)
PUT /api/users/me
Headers: { Authorization: Bearer {token} }
Body: { "firstName": "Hacked" }
// ✅ Expected: 403 Forbidden "Only admin can edit first and last name"

// Step 3: Update allowed field (should work)
PUT /api/users/me
Headers: { Authorization: Bearer {token} }
Body: { "phone": "+994501111111" }
// ✅ Expected: 200 OK

// Step 4: Admin updates member name (should work)
// Login as Admin
PUT /api/users/{member_id}
Headers: { Authorization: Bearer {admin_token} }
Body: { "firstName": "UpdatedByAdmin" }
// ✅ Expected: 200 OK
```

---

## Test Suite 3: Sparta-Only Restrictions

```javascript
// Test 3A: Instructor Role Assignment

// Reception tries (should fail)
POST /api/users
Headers: { Authorization: Bearer {reception_token} }
Body: { "firstName": "John", "email": "j@g.com", "role": "instructor" }
// ✅ Expected: 403 "Only Sparta can assign instructor role"

// Sparta tries (should work)
POST /api/users
Headers: { Authorization: Bearer {sparta_token} }
Body: { "firstName": "John", "email": "j@g.com", "role": "instructor" }
// ✅ Expected: 201 Created

// Test 3B: Membership Plan CRUD

// Reception tries to create plan (should fail)
POST /api/membership-plans
Headers: { Authorization: Bearer {reception_token} }
Body: { "name": "VIP Plan", "price": 200 }
// ✅ Expected: 403 "Sparta-level access required"

// Sparta tries (should work)
POST /api/membership-plans
Headers: { Authorization: Bearer {sparta_token} }
Body: { "name": "VIP Plan", "price": 200 }
// ✅ Expected: 201 Created
```

---

## Test Suite 4: Cross-Role Integration

**Scenario:** Complete class lifecycle across all roles

```javascript
// Step 1: Sparta creates instructor user
POST /api/users (role: instructor)
// ✅ 201 Created

// Step 2: Instructor logs in, creates class
POST /api/classes (Advanced Yoga)
// ✅ 201 Created, created_by = instructor.id

// Step 3: Member views classes, books class
GET /api/classes (see Advanced Yoga)
POST /api/classes/{id}/book
// ✅ 200 OK, booking created

// Step 4: Instructor views roster
GET /api/schedule/{slot_id}/bookings
// ✅ 200 OK, sees member in roster

// Step 5: Instructor updates class description
PUT /api/classes/{id} (update description)
// ✅ 200 OK

// Step 6: Member refreshes, sees updated description
GET /api/classes/{id}
// ✅ 200 OK, description updated

// Step 7: Member cancels booking
POST /api/classes/{id}/cancel
// ✅ 200 OK

// Step 8: Reception tries to delete class (should work)
DELETE /api/classes/{id}
// ✅ 200 OK (admin team can delete)

// Step 9: Member tries to book deleted class (should fail)
POST /api/classes/{id}/book
// ✅ 404 Not Found
```

---

# 📊 IMPLEMENTATION TIMELINE

## Day 1: Critical Blockers (8 hours)

**Morning (4 hours)**

- 09:00-10:30: BLOCKER 1.1-1.2 - Database migrations (ownership + RLS)
- 10:30-12:00: BLOCKER 1.3-1.4 - Backend API permissions + validation
- 12:00-13:00: Lunch

**Afternoon (4 hours)**

- 13:00-14:30: BLOCKER 1.5-1.6 - Frontend filtering + UI updates
- 14:30-15:00: BLOCKER 1.7 - Test instructor flow
- 15:00-16:00: BLOCKER 2 - Member name editing backend validation
- 16:00-17:00: Test member profile restrictions

---

## Day 2: Security & Permissions (6 hours)

**Morning (3 hours)**

- 09:00-11:00: BLOCKER 3.1-3.2 - Instructor role assignment restriction
- 11:00-12:00: BLOCKER 3.3-3.4 - Membership plans backend API
- 12:00-13:00: Lunch

**Afternoon (3 hours)**

- 13:00-14:00: BLOCKER 3.5-3.6 - Frontend service updates + testing
- 14:00-15:00: OPTIMIZATION 1 - Birthday checkbox refs
- 15:00-16:00: OPTIMIZATION 2 - Announcement expiry (if needed)

---

## Day 3: Testing & Polish (4 hours)

**Morning (2 hours)**

- 09:00-11:00: Execute all test suites (1-4)

**Afternoon (2 hours)**

- 11:00-12:00: Fix any discovered issues
- 12:00-13:00: Final verification + documentation update

---

# ✅ VERIFICATION CHECKLIST

## Before Starting:

- [ ] Backup database
- [ ] Create new git branch: `fix/instructor-role-and-permissions`
- [ ] Review testing report findings
- [ ] Confirm Supabase credentials in .env.dev

## After Each Phase:

- [ ] Run relevant test suite
- [ ] Verify database changes applied
- [ ] Check API responses match expected
- [ ] Test UI functionality manually
- [ ] Commit changes with descriptive message

## Final Verification:

- [ ] All 15 test scenarios pass
- [ ] No console errors in browser
- [ ] No backend errors in terminal
- [ ] All 14 functionalities at 100%
- [ ] Security restrictions enforced at all layers
- [ ] Documentation updated
- [ ] Create pull request for review

---

# 🎯 SUCCESS CRITERIA

**Phase 1 Complete When:**

- ✅ Instructors can create classes
- ✅ Instructors can edit ONLY their own classes
- ✅ Instructors cannot delete any classes
- ✅ Admin team (Sparta + Reception) can delete any class
- ✅ Members cannot bypass name editing restriction via API

**Phase 2 Complete When:**

- ✅ Only Sparta can assign instructor role
- ✅ Only Sparta can create/edit/delete membership plans
- ✅ Reception does NOT see Membership Manager button
- ✅ All API calls return proper 403 errors for unauthorized actions

**Phase 3 Complete When:**

- ✅ All code quality issues resolved
- ✅ Birthday checkbox selection uses refs (not selectors)
- ✅ Announcement expiry logic clarified and implemented

**Final Success:**

- ✅ **Deployment Readiness: 100%**
- ✅ All 14 functionalities working perfectly
- ✅ All layers (DB → API → UI → Flow) integrated
- ✅ Zero critical blockers
- ✅ Zero security vulnerabilities
- ✅ Ready for production deployment

---

# 📞 SUPPORT & ESCALATION

**If Issues Arise:**

1. **Database Migration Fails:**

   - Rollback: `node infra/supabase/rollback.js {migration_name}`
   - Check Supabase logs in dashboard
   - Verify no foreign key conflicts

2. **RLS Policies Break Existing Functionality:**

   - Disable RLS temporarily: `ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;`
   - Test policy in isolation with `SELECT ... WHERE {policy_condition}`
   - Re-enable after fix

3. **API Tests Fail:**

   - Check JWT token validity
   - Verify user role in database
   - Check middleware order in backend-server.js

4. **Frontend Errors:**
   - Clear browser cache + localStorage
   - Check network tab for API responses
   - Verify token in localStorage

---

# 🚀 POST-IMPLEMENTATION

**After All Fixes Complete:**

1. **Update Documentation:**

   - Update API documentation with new endpoints
   - Document new RLS policies
   - Update user role permissions matrix

2. **Performance Testing:**

   - Test with 1000+ classes (instructor filtering)
   - Test concurrent class bookings (50 members)
   - Check RLS policy performance

3. **Security Audit:**

   - Verify all API endpoints have proper middleware
   - Test authentication bypass attempts
   - Validate all RLS policies enforced

4. **Deployment:**
   - Deploy to staging environment
   - Run smoke tests
   - Deploy to production
   - Monitor for 24 hours

---

**Plan Generated:** October 25, 2024  
**Estimated Completion:** October 27, 2024  
**Final Deployment Readiness:** 100% ✅
