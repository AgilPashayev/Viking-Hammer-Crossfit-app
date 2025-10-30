-- Migration: Add emergency contact fields to users_profile table
-- Date: 2025-10-26
-- Description: Add emergency contact columns that were missing from users_profile table

-- Add emergency contact columns
ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_contact_country_code VARCHAR(10) DEFAULT '+994';

-- Add comments for documentation
COMMENT ON COLUMN public.users_profile.emergency_contact_name IS 'Emergency contact person full name';
COMMENT ON COLUMN public.users_profile.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN public.users_profile.emergency_contact_country_code IS 'Emergency contact country code prefix';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_profile_emergency_contact 
  ON public.users_profile(emergency_contact_name) 
  WHERE emergency_contact_name IS NOT NULL;
