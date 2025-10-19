-- 20251019_announcements_complete.sql
-- Update announcements table with all required fields for complete announcement system

-- Drop existing announcements table and recreate with full schema
DROP TABLE IF EXISTS public.announcements CASCADE;

CREATE TABLE IF NOT EXISTS public.announcements (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,  -- Changed from 'body' to 'content' to match API
  target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'members', 'instructors', 'staff')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES public.users_profile(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Additional fields for tracking
  views_count integer DEFAULT 0,
  read_by_users uuid[] DEFAULT ARRAY[]::uuid[]  -- Track which users have read the announcement
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_target_audience ON public.announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON public.announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_announcements_updated_at 
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW 
  EXECUTE FUNCTION update_announcements_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.announcements IS 'Gym announcements and notifications for members and staff';
COMMENT ON COLUMN public.announcements.target_audience IS 'Who can see this announcement: all, members, instructors, staff';
COMMENT ON COLUMN public.announcements.priority IS 'Urgency level: low, normal, high, urgent';
COMMENT ON COLUMN public.announcements.status IS 'Publication status: draft, published, archived';
COMMENT ON COLUMN public.announcements.read_by_users IS 'Array of user IDs who have read this announcement';
