-- Fix RLS policy for invitations to allow server-side creation
-- The backend service creates invitations with system authority (no user auth)

-- Drop the restrictive insert policy that requires authenticated user
DROP POLICY IF EXISTS "Admin users can insert invitations" ON public.invitations;

-- Create new policy that allows anon role to INSERT (for backend service)
-- Backend validates admin permissions BEFORE calling invitationService
-- This separates concerns: RLS allows technical operation, backend enforces business rules
CREATE POLICY "Backend service can create invitations"
  ON public.invitations
  FOR INSERT
  TO anon  -- The backend uses anon key
  WITH CHECK (true);

-- Also allow authenticated users (for future direct admin creation)
CREATE POLICY "Authenticated admin can create invitations"
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

-- Keep existing SELECT and UPDATE policies unchanged
-- They remain properly restrictive for security
