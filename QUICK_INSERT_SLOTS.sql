-- WORKAROUND: If constraint only allows day_of_week = 0, try Sunday slots
-- If this fails too, we need to check the actual constraint definition

-- TRY 1: Insert only Sunday (day_of_week = 0)
INSERT INTO schedule_slots (
  class_id,
  day_of_week,
  start_time,
  end_time,
  capacity,
  status
) VALUES 
  -- Sunday 9 AM (trying day_of_week = 0)
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 0, '09:00:00', '10:00:00', 20, 'active');

-- Check if it worked
SELECT 
  s.id,
  c.name as class_name,
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
  s.end_time
FROM schedule_slots s
JOIN classes c ON s.class_id = c.id;

/*
============================================
IF THE ABOVE FAILS:
============================================
The check constraint might have a bug or be configured incorrectly.

Please run this to see what the constraint actually checks:
*/

SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'schedule_slots'::regclass 
  AND conname LIKE '%day_of_week%';

/*
Then we need to either:
1. DROP the constraint if it's wrong
2. ALTER TABLE to fix it
3. Use different day_of_week values that pass the check

Common constraint definitions:
- CHECK (day_of_week >= 0 AND day_of_week <= 6)  -- Normal
- CHECK (day_of_week = 0)                         -- Only Sunday (bug!)
- CHECK (day_of_week BETWEEN 0 AND 6)             -- Normal
*/
