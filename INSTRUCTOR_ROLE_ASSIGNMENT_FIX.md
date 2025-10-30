# INSTRUCTOR ROLE ASSIGNMENT ERROR - FIX REQUIRED

**Date**: October 25, 2025  
**Issue**: "Server Error. Please try again" when assigning instructor role to user  
**Status**: ❌ **DATABASE CONSTRAINT ISSUE - MANUAL FIX REQUIRED**

---

## PROBLEM IDENTIFIED

### Error Details

```
Error updating user: {
  code: '23514',
  message: 'new row for relation "users_profile" violates check constraint "users_profile_role_check"'
}
```

### Root Cause

The database table `users_profile` has a CHECK constraint that only allows these roles:

- ✅ `'admin'`
- ✅ `'reception'`
- ✅ `'member'`
- ✅ `'sparta'`
- ❌ `'instructor'` ← **MISSING!**

The frontend UI and backend code support the `'instructor'` role, but the **database constraint does not allow it**.

---

## THE FIX (MANUAL SQL REQUIRED)

### Steps to Fix:

1. **Open Supabase Dashboard**

   - Go to your Supabase project dashboard
   - Navigate to: **SQL Editor** (in the left sidebar)

2. **Click "New Query"**

3. **Paste this SQL:**

```sql
ALTER TABLE public.users_profile
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE public.users_profile
  ADD CONSTRAINT users_profile_role_check
  CHECK (role IN ('admin','reception','member','sparta','instructor'));
```

4. **Run the Query**

   - Click the green **"Run"** button (or press `Ctrl+Enter`)
   - You should see: `Success. No rows returned`

5. **Verify the Fix**
   - Go back to your app at `http://localhost:5173/`
   - Try assigning the instructor role again
   - It should now work without errors ✅

---

## WHY THIS HAPPENED

### Migration History

The database was created with migrations that defined allowed roles, but `'instructor'` was never added to the CHECK constraint:

**File**: `infra/supabase/migrations/0002_add_sparta_role.sql`

```sql
ALTER TABLE public.users_profile
  ADD CONSTRAINT users_profile_role_check
  CHECK (role IN ('admin','reception','member','sparta'));
```

The `'instructor'` role was used throughout the application code but never added to the database constraint.

---

## WHAT WAS DONE

### 1. Created Migration File ✅

**File**: `infra/supabase/migrations/0003_add_instructor_role.sql`

This migration file adds 'instructor' to the allowed roles. However, it needs to be applied to the database.

### 2. Created Fix Scripts ✅

Two helper scripts were created:

- `apply_instructor_role_migration.js`
- `fix_instructor_role_constraint.js`

These scripts attempt to apply the fix automatically, but Supabase requires the SQL to be run through the dashboard for schema changes.

---

## AFTER THE FIX

Once you run the SQL in Supabase Dashboard, the following will work:

### ✅ Assign Instructor Role

1. Go to Member Management
2. Click "Edit" on any member
3. Change "Role" dropdown to "Instructor"
4. Click "Save Member"
5. **Success!** No more errors

### ✅ Complete Workflow

To make a user a full instructor:

1. **Set role to 'instructor'** in Member Management (will now work)
2. **Create instructor profile** in Instructor Management (add specialties, bio, etc.)
3. **Assign to classes** in Class Management

---

## VERIFICATION STEPS

### After applying the SQL fix:

1. **Test Role Assignment**:

   ```
   - Open Member Management
   - Edit a member
   - Change role to "Instructor"
   - Save
   - Should show: "✅ Member updated successfully!"
   ```

2. **Verify in Database**:

   ```sql
   SELECT name, email, role FROM users_profile WHERE role = 'instructor';
   ```

3. **Test All Roles**:
   - Try assigning: member, instructor, reception, sparta, admin
   - All should work without errors

---

## FILES CREATED/MODIFIED

### New Files:

1. ✅ `infra/supabase/migrations/0003_add_instructor_role.sql` - Migration file
2. ✅ `apply_instructor_role_migration.js` - Helper script
3. ✅ `fix_instructor_role_constraint.js` - Alternative fix script
4. ✅ `INSTRUCTOR_ROLE_ASSIGNMENT_FIX.md` - This documentation

### No Code Changes Required:

- ✅ Frontend code already supports instructor role
- ✅ Backend API already handles instructor role
- ✅ TypeScript interfaces already typed correctly
- ✅ UI components already have instructor in dropdowns

**Only the database constraint needs updating!**

---

## SUMMARY

| Item                | Status                                                         |
| ------------------- | -------------------------------------------------------------- |
| **Problem**         | ✅ Identified - Database CHECK constraint missing 'instructor' |
| **Root Cause**      | ✅ Found - Migration never added instructor to allowed roles   |
| **Migration File**  | ✅ Created - `0003_add_instructor_role.sql`                    |
| **Fix Script**      | ✅ Created - `fix_instructor_role_constraint.js`               |
| **SQL to Run**      | ✅ Provided - See section above                                |
| **Documentation**   | ✅ Complete - This file                                        |
| **Action Required** | ⏳ **MANUAL FIX** - Run SQL in Supabase Dashboard              |

---

## NEXT STEPS

### 🎯 Immediate Action Required:

**Run this SQL in Supabase Dashboard NOW:**

```sql
ALTER TABLE public.users_profile
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE public.users_profile
  ADD CONSTRAINT users_profile_role_check
  CHECK (role IN ('admin','reception','member','sparta','instructor'));
```

### After Fix Applied:

1. ✅ Test instructor role assignment
2. ✅ Verify no errors appear
3. ✅ Continue with normal app testing

---

**Estimated Fix Time**: 2 minutes  
**Impact**: High - Blocks instructor role assignment feature  
**Priority**: 🔴 **CRITICAL** - Required for instructor management  
**Complexity**: Low - Simple SQL constraint update

---
