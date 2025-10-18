-- 20251018_add_password_hash.sql
-- Add password_hash column to users_profile table for authentication

-- Add password_hash column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users_profile' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.users_profile 
    ADD COLUMN password_hash text;
  END IF;
END $$;

-- Add index for email lookup performance
CREATE INDEX IF NOT EXISTS idx_users_profile_email ON public.users_profile(email);

-- Add index for status lookup
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON public.users_profile(status);

-- Add index for role lookup
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON public.users_profile(role);

COMMENT ON COLUMN public.users_profile.password_hash IS 'Bcrypt hashed password for authentication';
