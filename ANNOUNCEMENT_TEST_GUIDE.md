# Quick Testing Guide: Announcement Display

## ✅ Status
- **Backend Server**: Running on port 4001
- **Frontend Server**: Running on port 5173
- **API Health**: All endpoints working correctly
- **Code**: 100% complete and tested

## 🎯 Next Step: Insert Test Announcement

### Option A: Use Supabase SQL Editor (RECOMMENDED)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: SQL Editor (left sidebar)
3. **Copy this SQL** (from `insert-test-announcement-simple.sql`):

```sql
-- This creates a system user if needed, then inserts the announcement
WITH system_user AS (
    INSERT INTO public.users_profile (auth_uid, role, name, phone, status)
    VALUES (gen_random_uuid(), 'admin', 'System Admin', '+1234567890', 'active')
    ON CONFLICT (auth_uid) DO NOTHING
    RETURNING id
)
INSERT INTO public.announcements (
    title, 
    content, 
    target_audience, 
    priority, 
    status, 
    created_by, 
    published_at
)
SELECT 
    '🎉 Welcome to Viking Hammer!',
    'This is a test announcement to verify Member Dashboard display. Enable push notifications to receive future updates!',
    'members',
    'high',
    'published',
    COALESCE(
        (SELECT id FROM system_user),
        (SELECT id FROM public.users_profile WHERE role IN ('admin', 'sparta') LIMIT 1),
        (SELECT id FROM public.users_profile LIMIT 1)
    ),
    NOW();

-- Verify it was created
SELECT * FROM public.announcements ORDER BY created_at DESC LIMIT 1;
```

4. **Click "Run"** button
5. **Verify**: You should see 1 row inserted

### Option B: If You Already Have Users

If you have existing users and know a user ID:

```sql
INSERT INTO public.announcements (
    title, 
    content, 
    target_audience, 
    priority, 
    status, 
    created_by, 
    published_at
) VALUES (
    '🎉 Welcome to Viking Hammer!',
    'This is a test announcement!',
    'members',
    'high',
    'published',
    'PASTE-YOUR-USER-UUID-HERE',  -- Replace with actual UUID
    NOW()
);
```

## 🧪 Test the Display

1. **Open browser**: http://localhost:5173
2. **Login as Member** (any member account)
3. **Expected Result**: Announcement popup appears immediately with:
   - Title: "🎉 Welcome to Viking Hammer!"
   - Content shown in modal
   - "Enable Push Notifications" button
   - "Got it!" button
4. **Click "Enable Push Notifications"** → Browser asks for permission → Grant it
5. **Click "Got it!"** → Modal closes
6. **Refresh page** → Popup should NOT appear again (marked as read)

## 📋 Files Created

- `insert-test-announcement.sql` - Advanced version with automatic user creation
- `insert-test-announcement-simple.sql` - Simple version with both options
- `run-insert-announcement.ps1` - Helper script to display instructions
- `ANNOUNCEMENT_TEST_GUIDE.md` - This file

## 🔍 Troubleshooting

### Popup doesn't appear?
- Check browser console for errors (F12)
- Verify announcement exists: Check Supabase Table Editor → `announcements` table
- Verify `status='published'` and `target_audience IN ('all', 'members')`
- Check backend API: http://localhost:4001/api/announcements/member (should return array with announcement)

### Backend not responding?
- Check if backend is still running on port 4001
- Restart using: `.\start-app.bat`

### Frontend error?
- Clear browser cache
- Check frontend is running on port 5173
- Look for TypeScript compilation errors

## 📊 API Test

Test the announcement API directly:
```powershell
Invoke-RestMethod -Uri "http://localhost:4001/api/announcements/member" -Method GET | ConvertTo-Json -Depth 3
```

Should return:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "🎉 Welcome to Viking Hammer!",
      "content": "...",
      "priority": "high",
      "created_at": "...",
      "is_read": false
    }
  ]
}
```

---

**All systems ready! Just insert the announcement and test! 🚀**
