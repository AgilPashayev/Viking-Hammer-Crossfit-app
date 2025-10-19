-- SUPER SIMPLE VERSION: Just insert announcement with a placeholder
-- Run these statements ONE AT A TIME in Supabase SQL Editor

-- Statement 1: Create a test user (if you don't have any)
INSERT INTO public.users_profile (id, auth_uid, role, name, phone, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    gen_random_uuid(),
    'admin',
    'System Admin',
    '+1234567890',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Statement 2: Insert test announcement
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
    'This is a test announcement to verify Member Dashboard display. Enable push notifications to receive future updates!',
    'members',
    'high',
    'published',
    '00000000-0000-0000-0000-000000000001',
    NOW()
);

-- Statement 3: Verify it worked
SELECT * FROM public.announcements ORDER BY created_at DESC LIMIT 1;
