-- 20251019_announcements_mark_read_complete.sql
-- Ensure announcements table has proper structure for mark-as-read functionality
-- This migration is idempotent and can be run multiple times safely

-- Verify read_by_users column exists and has correct type
DO $$
BEGIN
    -- Check if read_by_users column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'announcements' 
        AND column_name = 'read_by_users'
    ) THEN
        -- Add read_by_users column if it doesn't exist
        ALTER TABLE public.announcements 
        ADD COLUMN read_by_users uuid[] DEFAULT ARRAY[]::uuid[];
        
        RAISE NOTICE 'Added read_by_users column to announcements table';
    ELSE
        RAISE NOTICE 'read_by_users column already exists';
    END IF;
END $$;

-- Create index on read_by_users for better query performance
CREATE INDEX IF NOT EXISTS idx_announcements_read_by_users 
ON public.announcements USING GIN (read_by_users);

-- Create helper function to check if user has read announcement
CREATE OR REPLACE FUNCTION has_user_read_announcement(
    announcement_id bigint,
    user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    read_users uuid[];
BEGIN
    SELECT read_by_users INTO read_users
    FROM public.announcements
    WHERE id = announcement_id;
    
    RETURN user_id = ANY(read_users);
END;
$$;

-- Create helper function to get unread announcements for user
CREATE OR REPLACE FUNCTION get_unread_announcements_for_user(
    user_id uuid,
    user_role text DEFAULT 'member'
)
RETURNS TABLE (
    id bigint,
    title text,
    content text,
    target_audience text,
    priority text,
    status text,
    created_by uuid,
    published_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    views_count integer
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.target_audience,
        a.priority,
        a.status,
        a.created_by,
        a.published_at,
        a.created_at,
        a.updated_at,
        a.views_count
    FROM public.announcements a
    WHERE a.status = 'published'
        AND (a.target_audience = 'all' OR a.target_audience = user_role)
        AND NOT (user_id = ANY(a.read_by_users))
    ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
    LIMIT 20;
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN public.announcements.read_by_users IS 
    'Array of user UUIDs who have marked this announcement as read. Updated via POST /api/announcements/:id/mark-read';

COMMENT ON FUNCTION has_user_read_announcement IS 
    'Helper function to check if a specific user has read a specific announcement';

COMMENT ON FUNCTION get_unread_announcements_for_user IS 
    'Helper function to retrieve only unread announcements for a specific user based on their role';

-- Grant permissions
GRANT EXECUTE ON FUNCTION has_user_read_announcement TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_announcements_for_user TO authenticated;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Announcements mark-as-read functionality migration completed successfully';
    RAISE NOTICE 'Added index on read_by_users column';
    RAISE NOTICE 'Created helper functions: has_user_read_announcement, get_unread_announcements_for_user';
END $$;
