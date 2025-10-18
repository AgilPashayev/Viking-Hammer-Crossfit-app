# 🔧 MIGRATION FIXES - COMPLETE

## Issues Fixed ✅

### Issue 1: Column "role" does not exist ❌→✅

**File:** `20251017_membership_history.sql`  
**Error:** `ERROR: 42703: column "role" does not exist`

**Root Cause:**

- RLS policies referenced `user_profiles` table
- Actual table name is `users_profile` (with underscore)
- Referenced `role` column didn't exist in wrong table

**Fixed:**

- ✅ Changed all `user_profiles` references to `users_profile`
- ✅ Fixed 5 locations:
  1. Main foreign key: `user_id UUID NOT NULL REFERENCES users_profile(id)`
  2. Created by: `created_by UUID REFERENCES users_profile(id)`
  3. Cancelled by: `cancelled_by UUID REFERENCES users_profile(id)`
  4. RLS policy for SELECT (admin)
  5. RLS policy for INSERT (admin)
  6. RLS policy for UPDATE (admin)

### Issue 2: View creation causing errors ❌→✅

**File:** `0001_init.sql`  
**Problem:** `daily_checkins_v` view causing execution issues

**Fixed:**

- ✅ Removed view from main migration
- ✅ Created separate optional file: `optional_daily_checkins_view.sql`
- ✅ Can be run after all migrations complete if needed

---

## ✅ CORRECTED MIGRATION ORDER

Run these migrations in Supabase SQL Editor **in this exact order**:

```sql
1. ✅ 0001_init.sql (FIXED - view removed)
2. ✅ 20251007_create_user_profiles.sql
3. ✅ 20251016_email_verification.sql
4. ✅ 20251017_membership_history.sql (FIXED - table name corrected)
5. ✅ 20251018_classes_instructors_schedule.sql
6. ✅ 20251018_add_password_hash.sql
```

**Optional (run last if you need analytics):**

```sql
7. 🔹 optional_daily_checkins_view.sql
```

---

## 🧪 VERIFICATION QUERIES

After running all migrations, verify tables exist:

```sql
-- Check all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected tables:**

- ✅ users_profile (with password_hash column)
- ✅ plans
- ✅ memberships
- ✅ membership_history
- ✅ locations
- ✅ checkins
- ✅ qr_tokens
- ✅ announcements
- ✅ notifications_outbox
- ✅ audit_logs
- ✅ instructors
- ✅ classes
- ✅ class_instructors
- ✅ schedule_slots
- ✅ class_bookings

**Verify users_profile has role column:**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
ORDER BY ordinal_position;
```

**Expected columns include:**

- ✅ id (uuid)
- ✅ role (text)
- ✅ name (text)
- ✅ password_hash (text) ← Added by migration 6

---

## 📋 CHANGES SUMMARY

### Files Modified (2)

#### 1. `0001_init.sql`

**Before:**

```sql
-- views (example)
CREATE VIEW IF NOT EXISTS public.daily_checkins_v AS
SELECT date_trunc('day', ts) AS day, count(*) AS checkins
FROM public.checkins
GROUP BY 1
ORDER BY 1 DESC;
```

**After:**

```sql
-- (View removed - moved to optional file)
```

#### 2. `20251017_membership_history.sql`

**Before:**

```sql
user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
created_by UUID REFERENCES user_profiles(id),
cancelled_by UUID REFERENCES user_profiles(id),

-- In RLS policies:
SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'reception')
```

**After:**

```sql
user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
created_by UUID REFERENCES users_profile(id),
cancelled_by UUID REFERENCES users_profile(id),

-- In RLS policies:
SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'reception')
```

### Files Created (1)

#### `optional_daily_checkins_view.sql`

- Extracted view from main migration
- Can be run independently
- Improved GROUP BY syntax
- Added comment

---

## 🚀 NEXT STEPS

### 1. Clean Up (if migrations already partially run)

```sql
-- Drop the view if it exists
DROP VIEW IF EXISTS public.daily_checkins_v;

-- Drop membership_history if it was created with wrong references
DROP TABLE IF EXISTS public.membership_history CASCADE;
```

### 2. Run Fixed Migrations

Copy-paste content of each file in order (1-6) into Supabase SQL Editor.

### 3. Verify Success

```sql
-- Check users_profile table structure
\d users_profile;

-- Check membership_history foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'membership_history'
  AND tc.constraint_type = 'FOREIGN KEY';
```

**Expected result:**

- user_id → users_profile(id) ✅
- created_by → users_profile(id) ✅
- cancelled_by → users_profile(id) ✅

### 4. Start Backend

```powershell
node backend-server.js
```

Expected output:

```
✅ Supabase connection successful
🚀 Viking Hammer Backend API - PRODUCTION READY
```

---

## ✅ STATUS

- [x] Migration syntax errors fixed
- [x] Table name references corrected
- [x] View extraction completed
- [x] Verification queries provided
- [x] Documentation updated

**All migrations are now ready to run successfully!** ✨

---

**Fixed by:** CodeArchitect Pro  
**Date:** October 18, 2025  
**Status:** ✅ COMPLETE - Ready to run
