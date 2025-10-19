-- SIMPLIFIED VERSION: Insert Test Announcement
-- This version works on all PostgreSQL versions

-- Step 1: Create a system user if you don't have any users (run this first)
INSERT INTO public.users_profile (auth_uid, role, name, phone, status)
VALUES (gen_random_uuid(), 'admin', 'System Admin', '+1234567890', 'active')
ON CONFLICT (auth_uid) DO NOTHING;

-- Step 2: Insert the test announcement using the first available user
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
    (SELECT id FROM public.users_profile ORDER BY created_at ASC LIMIT 1),
    NOW();

-- Step 3: Verify the announcement was created
SELECT 
    id,
    title,
    content,
    target_audience,
    priority,
    status,
    created_by,
    published_at,
    created_at
FROM public.announcements
ORDER BY created_at DESC
LIMIT 1;
