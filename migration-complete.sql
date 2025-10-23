-- =============================================================================
-- VIKING HAMMER CROSSFIT - DATABASE MIGRATION
-- Complete schema update for invitation system and member management
-- =============================================================================

-- Step 1: Extend users_profile table with member management columns
-- =============================================================================
DO $$ 
BEGIN
  -- Add membership_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'users_profile' 
      AND column_name = 'membership_type'
  ) THEN
    ALTER TABLE public.users_profile ADD COLUMN membership_type text;
    RAISE NOTICE 'Added column: membership_type';
  ELSE
    RAISE NOTICE 'Column membership_type already exists';
  END IF;

  -- Add company column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'users_profile' 
      AND column_name = 'company'
  ) THEN
    ALTER TABLE public.users_profile ADD COLUMN company text;
    RAISE NOTICE 'Added column: company';
  ELSE
    RAISE NOTICE 'Column company already exists';
  END IF;

  -- Add join_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'users_profile' 
      AND column_name = 'join_date'
  ) THEN
    ALTER TABLE public.users_profile ADD COLUMN join_date date;
    RAISE NOTICE 'Added column: join_date';
  ELSE
    RAISE NOTICE 'Column join_date already exists';
  END IF;

  -- Add last_check_in column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'users_profile' 
      AND column_name = 'last_check_in'
  ) THEN
    ALTER TABLE public.users_profile ADD COLUMN last_check_in timestamptz;
    RAISE NOTICE 'Added column: last_check_in';
  ELSE
    RAISE NOTICE 'Column last_check_in already exists';
  END IF;
END $$;

-- Step 2: Create invitations table (if not exists)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE,
  invitation_token text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text,
  delivery_method text CHECK (delivery_method IN ('email', 'sms', 'whatsapp', 'in-app')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'failed')),
  invitation_message text,
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  accepted_at timestamptz,
  sent_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create indexes for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON public.invitations(user_id);

-- Step 4: Enable Row Level Security (RLS) and create policies
-- =============================================================================

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running script)
DROP POLICY IF EXISTS "Admin users can view all invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admin users can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admin users can update invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can view their own invitation" ON public.invitations;

-- Policy: Admin users (sparta/reception) can view all invitations
CREATE POLICY "Admin users can view all invitations"
  ON public.invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE users_profile.auth_uid = auth.uid()
        AND users_profile.role IN ('sparta', 'reception')
    )
  );

-- Policy: Admin users can insert invitations
CREATE POLICY "Admin users can insert invitations"
  ON public.invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE users_profile.auth_uid = auth.uid()
        AND users_profile.role IN ('sparta', 'reception')
    )
  );

-- Policy: Admin users can update invitations
CREATE POLICY "Admin users can update invitations"
  ON public.invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE users_profile.auth_uid = auth.uid()
        AND users_profile.role IN ('sparta', 'reception')
    )
  );

-- Policy: Users can view their own invitation (by email)
CREATE POLICY "Users can view their own invitation"
  ON public.invitations
  FOR SELECT
  USING (
    email = (
      SELECT users_profile.email 
      FROM public.users_profile 
      WHERE users_profile.auth_uid = auth.uid()
    )
  );

-- Step 5: Grant necessary permissions
-- =============================================================================
GRANT SELECT, INSERT, UPDATE ON public.invitations TO authenticated;
GRANT SELECT ON public.invitations TO anon;

-- Step 6: Add helpful comments for documentation
-- =============================================================================
COMMENT ON TABLE public.invitations IS 'Member invitation tracking with multi-channel delivery support';
COMMENT ON COLUMN public.users_profile.membership_type IS 'Member subscription plan (e.g., Monthly Unlimited, Pay-per-Class)';
COMMENT ON COLUMN public.users_profile.company IS 'Corporate membership company name';
COMMENT ON COLUMN public.users_profile.join_date IS 'Date member joined gym';
COMMENT ON COLUMN public.users_profile.last_check_in IS 'Timestamp of most recent gym check-in';

-- =============================================================================
-- Migration complete!
-- Run the verify-migration.js script to confirm all changes were applied.
-- =============================================================================
