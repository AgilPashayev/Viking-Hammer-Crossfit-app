-- 0002_add_sparta_role.sql
-- Add 'sparta' role to users_profile CHECK constraint
-- This migration allows 'sparta' role with same permissions as 'reception'

-- Drop existing constraint
ALTER TABLE public.users_profile 
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

-- Add new constraint with sparta role
ALTER TABLE public.users_profile 
  ADD CONSTRAINT users_profile_role_check 
  CHECK (role IN ('admin','reception','member','sparta'));

-- Update RLS policy for checkins to include sparta role
DROP POLICY IF EXISTS "checkins_insert_staff" ON public.checkins;

CREATE POLICY "checkins_insert_staff" ON public.checkins
  FOR INSERT WITH CHECK (auth.role() IN ('reception','sparta','admin') OR auth.role() = 'service_role');

-- Note: Sparta role has identical permissions to reception role
-- Both can: manage members, check-ins, memberships, classes, and schedules
