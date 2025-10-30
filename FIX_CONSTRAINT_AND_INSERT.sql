-- FIX THE CONSTRAINT: Drop and recreate it correctly
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraint
SELECT 
  conname,
  pg_get_constraintdef(oid) as current_definition
FROM pg_constraint 
WHERE conrelid = 'schedule_slots'::regclass 
  AND conname LIKE '%day_of_week%';

-- Step 2: Drop the broken constraint (if it exists)
ALTER TABLE schedule_slots 
DROP CONSTRAINT IF EXISTS schedule_slots_day_of_week_check;

-- Step 3: Add correct constraint (allows 0-6 for Sunday-Saturday)
ALTER TABLE schedule_slots 
ADD CONSTRAINT schedule_slots_day_of_week_check 
CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Step 4: Verify the fix
SELECT 
  conname,
  pg_get_constraintdef(oid) as new_definition
FROM pg_constraint 
WHERE conrelid = 'schedule_slots'::regclass 
  AND conname LIKE '%day_of_week%';

-- Step 5: Now insert the schedule slots
INSERT INTO schedule_slots (
  class_id,
  day_of_week,
  start_time,
  end_time,
  capacity,
  status
) VALUES 
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 1, '06:00:00', '07:00:00', 20, 'active'),
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 2, '06:00:00', '07:00:00', 20, 'active'),
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 3, '06:00:00', '07:00:00', 20, 'active'),
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 4, '06:00:00', '07:00:00', 20, 'active'),
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 5, '06:00:00', '07:00:00', 20, 'active'),
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 6, '09:00:00', '10:00:00', 20, 'active');

-- Step 6: Verify success
SELECT 
  s.id,
  c.name,
  s.day_of_week,
  CASE s.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  s.start_time,
  s.end_time,
  s.capacity
FROM schedule_slots s
JOIN classes c ON s.class_id = c.id
ORDER BY s.day_of_week, s.start_time;

SELECT COUNT(*) as total_slots FROM schedule_slots;
