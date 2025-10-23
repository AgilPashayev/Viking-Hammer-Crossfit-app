-- 20251022_extend_users_profile.sql
-- Extend users_profile to support richer member management data used by the frontend

ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS membership_type text DEFAULT 'Monthly',
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS join_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS last_check_in timestamptz;

COMMENT ON COLUMN public.users_profile.membership_type IS 'Displayed membership plan label for reception tools';
COMMENT ON COLUMN public.users_profile.company IS 'Optional corporate affiliation for the member';
COMMENT ON COLUMN public.users_profile.join_date IS 'Date the member joined the gym';
COMMENT ON COLUMN public.users_profile.last_check_in IS 'Timestamp of the member\'s most recent check-in';
