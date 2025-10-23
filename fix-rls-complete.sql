-- Step 1: Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'invitations';

-- Step 2: Drop ALL existing INSERT policies
DROP POLICY IF EXISTS "Admin users can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Backend service can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Authenticated admin can create invitations" ON public.invitations;

-- Step 3: Create permissive policy for anon role (for backend service)
CREATE POLICY "invitations_insert_anon"
ON public.invitations
FOR INSERT
TO anon
WITH CHECK (true);

-- Step 4: Create policy for authenticated admin users
CREATE POLICY "invitations_insert_authenticated"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE users_profile.auth_uid = auth.uid()
      AND users_profile.role IN ('sparta', 'reception')
  )
);

-- Step 5: Verify policies were created
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'invitations' AND cmd = 'INSERT';
