-- FIX: day_of_week is TEXT, not INTEGER!
-- We need to either:
-- 1. Change the column type to INTEGER, OR
-- 2. Use string values in the constraint

-- OPTION 1 (RECOMMENDED): Convert column to INTEGER
-- Step 1: Check current column type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'schedule_slots' 
  AND column_name = 'day_of_week';

-- Step 2: Drop the broken constraint
ALTER TABLE schedule_slots 
DROP CONSTRAINT IF EXISTS schedule_slots_day_of_week_check;

-- Step 3: Convert column to INTEGER (if it's currently TEXT)
ALTER TABLE schedule_slots 
ALTER COLUMN day_of_week TYPE INTEGER USING day_of_week::INTEGER;

-- Step 4: Add correct constraint for INTEGER
ALTER TABLE schedule_slots 
ADD CONSTRAINT schedule_slots_day_of_week_check 
CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Step 5: Verify the fix
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'schedule_slots' 
  AND column_name = 'day_of_week';

-- Step 6: Now insert schedule slots with INTEGER values
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

-- Step 7: Verify success
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
  s.end_time
FROM schedule_slots s
JOIN classes c ON s.class_id = c.id
ORDER BY s.day_of_week, s.start_time;

SELECT COUNT(*) as total_slots FROM schedule_slots;
