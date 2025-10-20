-- Reset read status for testing mark-as-read functionality
-- This clears the read_by_users array so announcements appear as unread again

-- Clear read_by_users for all announcements (for testing)
UPDATE public.announcements 
SET read_by_users = ARRAY[]::uuid[]
WHERE status = 'published';

-- Verify the reset
SELECT 
    id,
    title,
    array_length(read_by_users, 1) as read_count,
    read_by_users
FROM public.announcements
WHERE status = 'published'
ORDER BY published_at DESC;
