-- DEBUG: Check what the constraint actually allows
-- Run this FIRST to see the constraint definition

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'schedule_slots'::regclass 
  AND conname LIKE '%day_of_week%';

-- This will show you something like:
-- CHECK ((day_of_week >= 0) AND (day_of_week <= 6))
-- OR
-- CHECK (day_of_week = 0)
-- OR something else

-- Once we see the constraint, we'll know what values are allowed
