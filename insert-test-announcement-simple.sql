-- SIMPLE VERSION: Insert Test Announcement with Auto-Generated User
-- Run this in Supabase SQL Editor

-- Option 1: If you have users in your database, use this
-- (Uncomment and replace YOUR-USER-ID with an actual UUID from users_profile table)
/*
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
    'This is a test announcement! Click "Enable Push Notifications" to stay updated.',
    'members',
    'high',
    'published',
    'YOUR-USER-ID-HERE',  -- Replace with actual UUID
    NOW()
);
*/

-- Option 2: If you DON'T have users, use this (creates a system user automatically)
-- This is the safest option for testing
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

-- Verify the announcement
SELECT 
    id,
    title,
    LEFT(content, 50) || '...' as content_preview,
    target_audience,
    priority,
    status,
    created_by,
    published_at,
    created_at
FROM public.announcements
ORDER BY created_at DESC
LIMIT 3;
