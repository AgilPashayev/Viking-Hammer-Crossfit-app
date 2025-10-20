# 🎯 VISUAL GUIDE: Adding Sparta Role in Supabase Dashboard

## ✅ EASIEST METHOD - SQL Editor (2 Minutes)

Since you can't find the Constraints/Schema tab, use the **SQL Editor** method - it's faster and guaranteed to work!

---

### Step 1️⃣: Login to Supabase

```
🌐 Open Browser → https://supabase.com/dashboard
```

You should see your projects list.

---

### Step 2️⃣: Select Your Project

Click on your project (it might be named something like):

- "Viking Hammer CrossFit"
- "viking-hammer-crossfit-app"
- Or whatever name you gave it

---

### Step 3️⃣: Find SQL Editor in Sidebar

Look at the **LEFT SIDEBAR** - you'll see icons and menu items:

```
📋 Sidebar Menu:
├── 🏠 Home
├── 📊 Table Editor          ← NOT this one
├── 🔐 Authentication
├── 💾 Storage
├── </> SQL Editor          ← CLICK THIS ONE!
├── 🔧 Database
│   ├── Tables
│   ├── Replication
│   ├── Backups
│   └── Extensions
├── ⚡ Edge Functions
├── 📈 Reports
└── ⚙️  Settings
```

**Look for**: `</>` icon with text **"SQL Editor"** or just **"SQL"**

---

### Step 4️⃣: Create New Query

Once you click "SQL Editor", you'll see:

```
┌─────────────────────────────────────────────┐
│  SQL Editor                    [+ New query] │ ← Click this button
├─────────────────────────────────────────────┤
│                                              │
│  Your saved queries will appear here        │
│                                              │
└─────────────────────────────────────────────┘
```

Click the **"+ New query"** button (top right, green color)

---

### Step 5️⃣: Paste the Migration SQL

You'll see a text editor. **Delete any placeholder text** and paste this:

```sql
-- ================================================
-- SPARTA ROLE MIGRATION
-- Adds 'sparta' role to users_profile table
-- ================================================

-- Step 1: Remove old constraint
ALTER TABLE public.users_profile
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

-- Step 2: Add new constraint with sparta
ALTER TABLE public.users_profile
  ADD CONSTRAINT users_profile_role_check
  CHECK (role IN ('admin', 'reception', 'member', 'sparta'));

-- Step 3: Verify it worked
SELECT
  'Constraint updated successfully!' as status,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users_profile'::regclass
  AND conname = 'users_profile_role_check';
```

---

### Step 6️⃣: Run the Query

```
┌─────────────────────────────────────────────┐
│  [▶ RUN]  [Save]  [Format]                  │ ← Click "RUN" button
├─────────────────────────────────────────────┤
│  -- Your SQL code here                      │
│                                              │
└─────────────────────────────────────────────┘
```

Click the **green "RUN"** button (or press `F5` or `Ctrl+Enter`)

---

### Step 7️⃣: Check Results

At the bottom, you should see:

**✅ SUCCESS:**

```
Results (1 row)
┌────────────────────────────────┬──────────────────────────────────────┐
│ status                         │ definition                           │
├────────────────────────────────┼──────────────────────────────────────┤
│ Constraint updated             │ CHECK ((role = ANY (ARRAY['admin'::  │
│ successfully!                  │ text, 'reception'::text, 'member'::  │
│                                │ text, 'sparta'::text])))             │
└────────────────────────────────┴──────────────────────────────────────┘

Success. 1 row returned.
```

If you see **'sparta'** in the definition, **YOU'RE DONE!** 🎉

---

## 🔍 Alternative: If You Still Can't Find SQL Editor

### Try These Paths:

**Option A: Via Database Menu**

```
Left Sidebar → Database → SQL Editor
```

**Option B: Via URL**

```
https://app.supabase.com/project/YOUR-PROJECT-ID/sql/new
```

(Replace YOUR-PROJECT-ID with your actual project ID from the URL)

**Option C: Command Palette**

```
Press: Ctrl + K (Windows) or Cmd + K (Mac)
Type: "SQL Editor"
Press Enter
```

---

## ❌ What NOT to Look For

**DON'T** try to find:

- ❌ "Constraints" tab (doesn't exist in new Supabase UI)
- ❌ "Schema" tab (not in the main interface)
- ❌ Column editing dialogs (too complicated)

**DO** use:

- ✅ SQL Editor (simplest and fastest!)

---

## 🆘 Still Can't Find SQL Editor?

### Quick Screenshot Guide:

1. **Take a screenshot** of your Supabase dashboard left sidebar
2. Send it to me and I'll point exactly where to click

OR

### Use This Direct Link:

Replace `YOUR-PROJECT-REF` with your project reference:

```
https://app.supabase.com/project/YOUR-PROJECT-REF/sql/new
```

You can find your project reference in the URL when you're on any Supabase page:

```
https://app.supabase.com/project/abcdefghijklmnop/...
                                      ^^^^^^^^^^^^^^^^
                                      This is your project reference
```

---

## ✅ After Running the SQL

### Test It Worked:

**Option 1: PowerShell Test**

```powershell
cd C:\Users\AgiL\viking-hammer-crossfit-app
powershell -ExecutionPolicy Bypass -File test-sparta-role.ps1
```

**Expected Output:**

```
✅ Create Sparta User - PASS
✅ ALL SPARTA ROLE TESTS PASSED!
```

**Option 2: Create Sparta User Manually**

```powershell
$spartaUser = @{
    name = "Sparta Warrior"
    email = "sparta@vikinghammer.com"
    phone = "+994501234567"
    role = "sparta"
    password = "SpartaWarrior123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4001/api/users" `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $spartaUser
```

**If it works**: ✅ You'll see the user created with role "sparta"  
**If it fails**: ❌ Error means migration not complete

---

## 📞 Need Help?

If you still can't find the SQL Editor:

1. **Copy your current Supabase dashboard URL** and send it to me
2. Or tell me what you see in the left sidebar menu
3. Or take a screenshot of the Supabase interface

I'll guide you to the exact location! 🚀

---

## 🎯 Summary

**What you're doing:** Adding 'sparta' as a valid role value  
**Where:** In the `users_profile` table's `role` column constraint  
**How:** By running SQL that updates the CHECK constraint  
**Time needed:** 2 minutes using SQL Editor

**The constraint change:**

- **Before:** `role IN ('admin', 'reception', 'member')`
- **After:** `role IN ('admin', 'reception', 'member', 'sparta')`

That's it! Once this SQL runs successfully, sparta users can be created. ✅
