-- 0003_add_instructor_role.sql
-- Add 'instructor' role to users_profile CHECK constraint
-- This migration allows 'instructor' role for users who teach classes

-- Drop existing constraint
ALTER TABLE public.users_profile 
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

-- Add new constraint with instructor role included
ALTER TABLE public.users_profile 
  ADD CONSTRAINT users_profile_role_check 
  CHECK (role IN ('admin','reception','member','sparta','instructor'));

-- Note: Instructor role allows users to be assigned to classes
-- Instructors have access to class management and schedule features
