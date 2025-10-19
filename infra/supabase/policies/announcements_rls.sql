-- Announcements RLS Policy
-- Purpose: Add Row Level Security policy to filter announcements by target_audience
-- Date: October 19, 2025

-- Enable RLS on announcements table if not already enabled
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "announcements_select_public" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_members" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_staff" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_staff" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_admin" ON public.announcements;

-- Policy: Public can read published announcements targeted to 'all'
CREATE POLICY "announcements_select_public" ON public.announcements
  FOR SELECT
  USING (
    status = 'published' AND 
    (target_audience = 'all' OR target_audience IS NULL)
  );

-- Policy: Authenticated members can read announcements targeted to 'all' or 'members'
CREATE POLICY "announcements_select_members" ON public.announcements
  FOR SELECT
  USING (
    status = 'published' AND 
    (target_audience = 'all' OR target_audience = 'members')
  );

-- Policy: Staff (admin, reception, sparta) can create announcements
CREATE POLICY "announcements_insert_staff" ON public.announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = auth.uid() 
      AND role IN ('admin', 'reception', 'sparta')
    )
  );

-- Policy: Staff (admin, reception, sparta) can update announcements
CREATE POLICY "announcements_update_staff" ON public.announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = auth.uid() 
      AND role IN ('admin', 'reception', 'sparta')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = auth.uid() 
      AND role IN ('admin', 'reception', 'sparta')
    )
  );

-- Policy: Only admins can delete announcements
CREATE POLICY "announcements_delete_admin" ON public.announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.announcements TO authenticated;
GRANT SELECT ON public.announcements TO anon;
GRANT INSERT, UPDATE ON public.announcements TO authenticated;
GRANT DELETE ON public.announcements TO authenticated;

-- Comment on policies
COMMENT ON POLICY "announcements_select_public" ON public.announcements IS 'Public users can read announcements targeted to all';
COMMENT ON POLICY "announcements_select_members" ON public.announcements IS 'Members can read announcements targeted to all or members';
COMMENT ON POLICY "announcements_insert_staff" ON public.announcements IS 'Staff can create announcements';
COMMENT ON POLICY "announcements_update_staff" ON public.announcements IS 'Staff can update announcements';
COMMENT ON POLICY "announcements_delete_admin" ON public.announcements IS 'Only admins can delete announcements';
