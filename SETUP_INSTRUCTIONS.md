# ⚙️ COMPLETE SETUP INSTRUCTIONS

## Member Profile Features - Database & Storage Configuration

### 📋 OVERVIEW

This document provides step-by-step instructions to complete the setup of Member Profile features.

---

## 🔴 CRITICAL: DATABASE MIGRATION REQUIRED

### Step 1: Add Emergency Contact Columns

**Option A: Via Supabase Dashboard (RECOMMENDED)**

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add emergency contact columns to users_profile table
ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_contact_country_code VARCHAR(10) DEFAULT '+994';

-- Add comments for documentation
COMMENT ON COLUMN public.users_profile.emergency_contact_name IS 'Emergency contact person full name';
COMMENT ON COLUMN public.users_profile.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN public.users_profile.emergency_contact_country_code IS 'Emergency contact country code prefix';

-- Verify columns were added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users_profile'
AND column_name LIKE 'emergency%';
```

5. Click **RUN** (or press Ctrl+Enter)
6. Verify you see 3 rows returned showing the emergency contact columns

**Option B: Via Migration File**

The migration file is already created at:
`infra/supabase/migrations/20251026_add_emergency_contact_fields.sql`

Run it using your preferred migration tool.

---

## 🔴 CRITICAL: STORAGE BUCKET SETUP

### Step 2: Create Supabase Storage Bucket for Profile Photos

**Via Supabase Dashboard:**

1. Open your Supabase project dashboard
2. Navigate to **Storage** (left sidebar)
3. Click **New bucket**
4. Configure bucket:
   - **Name:** `user-avatars`
   - **Public bucket:** ✅ YES (check this box)
   - **File size limit:** 5242880 (5MB)
   - **Allowed MIME types:** `image/*`
5. Click **Create bucket**

**Set Bucket Policies:**

1. Click on the `user-avatars` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Add these policies:

**Policy 1: Allow Authenticated Users to Upload**

```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Policy 2: Allow Public Read Access**

```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');
```

**Policy 3: Allow Users to Update Own Photos**

```sql
CREATE POLICY "Allow users to update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Policy 4: Allow Users to Delete Own Photos**

```sql
CREATE POLICY "Allow users to delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## ✅ VERIFICATION STEPS

### Verify Database Migration

Run this in SQL Editor:

```sql
-- Check if emergency contact columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
  AND column_name LIKE 'emergency%'
ORDER BY column_name;
```

Expected output: 3 rows showing emergency_contact_name, emergency_contact_phone, emergency_contact_country_code

### Verify Storage Bucket

1. Go to Storage → user-avatars
2. Should see: "Public" badge
3. Upload a test image manually to verify

---

## 🚀 RESTART SERVERS AFTER SETUP

After completing the database migration and storage setup:

```powershell
# Stop all Node processes
taskkill /F /IM node.exe

# Wait 2 seconds
Start-Sleep -Seconds 2

# Start backend
cd c:\Users\AgiL\viking-hammer-crossfit-app
node backend-server.js

# In a new terminal, start frontend
cd c:\Users\AgiL\viking-hammer-crossfit-app\frontend
npm run dev
```

---

## 🧪 TEST ALL FEATURES

### 1. Test Personal Info Edit

- ✅ Go to My Profile → Personal Info tab
- ✅ Click "Edit" button
- ✅ Modify Email, Phone, DOB, or Gender
- ✅ Click "Save Changes"
- ✅ Verify success message
- ✅ Reload page and verify changes persisted

### 2. Test Emergency Contact

- ✅ Go to My Profile → Emergency Contact tab
- ✅ Click "Edit" button
- ✅ Enter name and phone
- ✅ Click "Save Changes"
- ✅ Verify success message (no migration error)
- ✅ Reload page and verify data persisted

### 3. Test Profile Photo Upload

- ✅ Click on profile photo area
- ✅ Select an image (under 5MB)
- ✅ Verify upload success message
- ✅ Photo should display immediately
- ✅ Check in database that avatar_url is saved

### 4. Test Settings

- ✅ Go to My Profile → Settings tab
- ✅ Change any setting
- ✅ Click "Save Changes"
- ✅ Verify success message (NOT "Please login again")
- ✅ Reload page and verify settings persisted

### 5. Test Subscription Tab

- ✅ Go to My Profile → My Subscription tab
- ✅ Should load real data from database OR show "No Active Subscription"
- ✅ No mock/hardcoded data

---

## 📊 FEATURE STATUS AFTER SETUP

| Feature              | Status             | Database | Backend | Frontend | Storage |
| -------------------- | ------------------ | -------- | ------- | -------- | ------- |
| Personal Info Edit   | ✅ Ready           | ✅       | ✅      | ✅       | N/A     |
| Emergency Contact    | ⏳ Needs Migration | ❌→✅    | ✅      | ✅       | N/A     |
| Profile Photo Upload | ⏳ Needs Bucket    | ✅       | ✅      | ✅       | ❌→✅   |
| Settings Save        | ✅ Ready           | ✅       | ✅      | ✅       | N/A     |
| Subscription Tab     | ✅ Working         | ✅       | ✅      | ✅       | N/A     |

---

## 🆘 TROUBLESHOOTING

### Emergency Contact Still Failing After Migration

**Check if migration ran successfully:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users_profile' AND column_name LIKE 'emergency%';
```

If no results, migration didn't run. Re-run the SQL from Step 1.

### Photo Upload Still Failing After Bucket Creation

**Check bucket exists and is public:**

```sql
SELECT * FROM storage.buckets WHERE name = 'user-avatars';
```

Should show: `public = true`

**Check policies exist:**

```sql
SELECT policyname, permissive, cmd FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%user-avatars%';
```

Should show 4 policies.

### Settings Save Returning "Authentication required"

**This is now fixed!** The backend now requires authentication.

Make sure you:

1. Are logged in
2. Have valid authToken in localStorage
3. Backend server was restarted after code changes

---

## 📝 WHAT WAS FIXED

### 1. Personal Info Tab

- ✅ Added Edit/Save/Cancel buttons
- ✅ First/Last name ALWAYS disabled (cannot edit)
- ✅ Email, Phone, DOB, Gender editable when Edit mode active
- ✅ Save functionality with API integration
- ✅ Validation and error handling

### 2. Emergency Contact Tab

- ✅ Already had Edit/Save functionality
- ✅ Enhanced error messages
- ✅ Now shows helpful message if migration needed
- ✅ Full database integration (after migration)

### 3. Profile Photo Upload

- ✅ Base64 encoding working
- ✅ Backend upload to Supabase Storage
- ✅ Auto-creates bucket (if has permissions)
- ✅ Saves avatar_url to database
- ✅ Enhanced error messages

### 4. Settings Tab

- ✅ Added authentication middleware (security fix)
- ✅ Response format corrected ({ success: true, data: {...} })
- ✅ Now shows success message correctly

### 5. Subscription Tab

- ✅ Already working!
- ✅ Loads real data from /api/subscriptions/user/:userId
- ✅ Displays all subscription details
- ✅ Shows "No Active Subscription" when no data

---

## ✅ COMPLETION CHECKLIST

- [ ] Ran database migration (Step 1)
- [ ] Verified emergency contact columns exist
- [ ] Created user-avatars storage bucket (Step 2)
- [ ] Set bucket to PUBLIC
- [ ] Added storage policies
- [ ] Restarted backend server
- [ ] Restarted frontend server
- [ ] Tested Personal Info edit
- [ ] Tested Emergency Contact save
- [ ] Tested Profile Photo upload
- [ ] Tested Settings save
- [ ] Tested Subscription tab loads data
- [ ] All features working without errors

---

**After completing this setup, ALL Member Profile features will be fully functional!** 🎉
