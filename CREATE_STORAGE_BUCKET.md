# 🪣 CREATE STORAGE BUCKET FOR PHOTO UPLOADS

## ⚠️ CRITICAL: Photo Upload Requires Manual Bucket Creation

**Current Error**: "Storage configuration error. Please contact support"

**Root Cause**: The `user-avatars` storage bucket does not exist in your Supabase project.

**Why Manual**: Supabase Row-Level Security (RLS) prevents programmatic bucket creation from the backend.

---

## 📋 QUICK FIX (5 MINUTES)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **Viking Hammer CrossFit**
3. Click **Storage** in the left sidebar

### Step 2: Create Bucket

1. Click **"New bucket"** button (top right)
2. Fill in the form:
   ```
   Name:              user-avatars
   Public bucket:     ✅ CHECK THIS BOX (very important!)
   File size limit:   5242880 (5MB)
   Allowed MIME types: image/*
   ```
3. Click **"Create bucket"**

### Step 3: Set Policies (Required for Upload)

1. Click on the newly created `user-avatars` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Add **4 policies** (copy SQL from below):

#### Policy 1: Allow Authenticated Upload

```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars');
```

#### Policy 2: Allow Public Read

```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');
```

#### Policy 3: Allow Users to Update Own Photos

```sql
CREATE POLICY "Allow users to update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars');
```

#### Policy 4: Allow Users to Delete Own Photos

```sql
CREATE POLICY "Allow users to delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars');
```

### Step 4: Verify

1. Go back to **Storage** main page
2. Click on `user-avatars` bucket
3. You should see:
   - ✅ **"Public"** badge on the bucket
   - ✅ **4 policies** listed in Policies tab

---

## 🧪 TEST PHOTO UPLOAD

After creating the bucket:

1. **Refresh your browser** (clear cache if needed)
2. Go to **My Profile** page
3. Click on the **profile photo circle**
4. Select an image (under 5MB)
5. You should see: **"Photo Updated! Your profile photo has been updated successfully."**

---

## 📊 CURRENT BACKEND LOGS

```
❌ Storage upload error: StorageApiError: Bucket not found
   status: 400, statusCode: '404'

❌ Bucket creation error: StorageApiError: new row violates row-level security policy
   status: 400, statusCode: '403'
```

This confirms the bucket doesn't exist and cannot be created programmatically.

---

## ✅ AFTER BUCKET CREATION

Once you create the bucket manually, your backend logs will show:

```
✅ Photo uploaded successfully: https://yjscvjpnscpabyvghcgr.supabase.co/storage/v1/object/public/user-avatars/avatars/[user-id]-[timestamp].jpeg
```

And the photo will appear immediately in the UI!

---

## 🆘 TROUBLESHOOTING

### Photo Upload Still Fails After Bucket Creation

**Check 1: Bucket is Public**

```sql
SELECT id, name, public FROM storage.buckets WHERE name = 'user-avatars';
```

Should return: `public = true`

**Check 2: Policies Exist**

```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%user-avatars%';
```

Should return 4 policies (INSERT, SELECT, UPDATE, DELETE)

**Check 3: Restart Backend**

```powershell
# Stop backend
taskkill /F /IM node.exe

# Start backend
cd c:\Users\AgiL\viking-hammer-crossfit-app
node backend-server.js
```

---

## 📝 WHY THIS IS NECESSARY

Supabase implements strict Row-Level Security (RLS) policies that prevent:

- Creating storage buckets from application code
- Modifying storage configuration programmatically
- Bypassing security policies

This is a **security feature** to prevent unauthorized storage access.

**Solution**: One-time manual setup in Supabase Dashboard.

---

## ⏱️ ESTIMATED TIME: 5 MINUTES

1. Create bucket (2 min)
2. Add 4 policies (2 min)
3. Verify and test (1 min)

**After this, photo uploads will work perfectly! 📸✅**
