# Supabase Service Role Key Setup

## Overview

The backend needs the **Service Role Key** to bypass RLS (Row Level Security) policies when uploading files to Supabase Storage. This is required because the backend operates on behalf of users.

## Setup Steps

### 1. Get Your Service Role Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Click on your project: `nqseztalzjcfucfeljkf`
3. Navigate to **Settings** (bottom left) → **API**
4. Find the **`service_role` key** (NOT the `anon` key)
5. Copy the long JWT token

**IMPORTANT**: Keep this key secret! It bypasses all RLS policies.

### 2. Add to Environment Variables

Open `env/.env.dev` and add this line:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Example** (your actual key will be different):

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc2V6dGFsempjZnVjZmVsamtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcxMTY3NywiZXhwIjoyMDc1Mjg3Njc3fQ...
```

### 3. Restart Backend Server

After adding the key:

```bash
cd c:\Users\AgiL\viking-hammer-crossfit-app
node backend-server.js
```

## What This Fixes

✅ **Photo Upload**: Backend can now upload to `user-avatars` bucket without RLS errors  
✅ **403 Errors**: "new row violates row-level security policy" errors resolved  
✅ **File Management**: Backend can manage storage operations for users

## Security Note

- **`anon` key**: Used by frontend (requires RLS policies) ✅ Already configured
- **`service_role` key**: Used by backend (bypasses RLS) ⚠️ MUST BE SECRET

Never expose the `service_role` key to the frontend or commit it to public repositories!

## Verification

Once added and server restarted, upload should work with logs like:

```
📸 Processing base64 photo upload for user: <user-id>
📤 Uploading to Supabase storage: avatars/<filename>
✅ Photo uploaded successfully: <url>
```

## Time Required

⏱️ 2 minutes
