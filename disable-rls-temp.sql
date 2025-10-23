-- SIMPLE FIX: Disable RLS on invitations table temporarily to test
-- Run this in Supabase SQL Editor

ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;

-- After testing, you can re-enable with proper policies
