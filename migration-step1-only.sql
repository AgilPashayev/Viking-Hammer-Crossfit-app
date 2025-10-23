-- Step 1: Extend users_profile table with member management columns
-- Copy and paste this COMPLETE block into Supabase SQL Editor

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
