-- Insert Test Announcement
-- This script creates a test announcement for the Member Dashboard

-- Step 1: Get an existing user ID (or create a placeholder)
-- If no users exist, we'll use a generated UUID
DO $$
DECLARE
    creator_id UUID;
BEGIN
    -- Try to get an existing admin or sparta user
    SELECT id INTO creator_id 
    FROM public.users_profile 
    WHERE role IN ('admin', 'sparta') 
    LIMIT 1;
    
    -- If no user found, get any user
    IF creator_id IS NULL THEN
        SELECT id INTO creator_id 
        FROM public.users_profile 
        LIMIT 1;
    END IF;
    
    -- If still no user, create a placeholder user profile
    IF creator_id IS NULL THEN
        INSERT INTO public.users_profile (auth_uid, role, name, phone, status)
        VALUES (gen_random_uuid(), 'admin', 'System Admin', '+1234567890', 'active')
        RETURNING id INTO creator_id;
        
        RAISE NOTICE 'Created new admin user with ID: %', creator_id;
    END IF;
    
    -- Insert the test announcement
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
        'This is a test announcement to verify the Member Dashboard display. Click "Enable Push Notifications" to receive future updates directly on your device!',
        'members',  -- Will display to all member users
        'high',
        'published',
        creator_id,
        NOW()
    );
    
    RAISE NOTICE 'Test announcement created successfully!';
    RAISE NOTICE 'Created by user ID: %', creator_id;
END $$;

-- Verify the announcement was created
SELECT 
    id,
    title,
    content,
    target_audience,
    priority,
    status,
    created_by,
    published_at
FROM public.announcements
ORDER BY created_at DESC
LIMIT 1;
