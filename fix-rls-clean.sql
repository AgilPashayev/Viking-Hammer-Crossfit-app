-- Fix RLS policy for invitations - COPY AND RUN THIS IN SUPABASE SQL EDITOR

DROP POLICY IF EXISTS "Admin users can insert invitations" ON public.invitations;

CREATE POLICY "Backend service can create invitations"
  ON public.invitations
  FOR INSERT
  TO anon
  WITH CHECK (true);

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
