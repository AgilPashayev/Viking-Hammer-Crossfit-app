-- Complete RLS fix with proper role grants
-- Run this COMPLETE block in Supabase SQL Editor

-- 1. Ensure anon role has proper table permissions
GRANT ALL ON public.invitations TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Drop and recreate the policy to ensure it's correct
DROP POLICY IF EXISTS "invitations_insert_anon" ON public.invitations;

CREATE POLICY "invitations_insert_anon"
ON public.invitations
AS PERMISSIVE  -- Explicitly mark as permissive
FOR INSERT
TO anon
WITH CHECK (true);

-- 3. Verify the policy
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'invitations' AND cmd = 'INSERT';
