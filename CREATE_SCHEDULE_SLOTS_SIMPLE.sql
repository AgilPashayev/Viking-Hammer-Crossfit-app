-- SIMPLE SCHEDULE SLOTS CREATION
-- Safe version that checks constraints first
-- Run this in Supabase SQL Editor

-- STEP 1: Check what constraint exists on day_of_week
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'schedule_slots'::regclass 
  AND conname LIKE '%day_of_week%';

-- STEP 2: View your existing classes
SELECT 
  id,
  name,
  duration_minutes,
  status
FROM classes 
WHERE status = 'active'
ORDER BY name
LIMIT 20;

-- STEP 3: Manual insert for ONE class (SAFEST METHOD)
-- Replace 'YOUR-CLASS-ID' with actual UUID from Step 2

-- Example for CrossFit class (assuming first class from your list)
INSERT INTO schedule_slots (
  class_id,
  day_of_week,
  start_time,
  end_time,
  capacity,
  status
) VALUES 
  -- Monday 6 AM
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 1, '06:00:00', '07:00:00', 20, 'active'),
  -- Tuesday 6 AM
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 2, '06:00:00', '07:00:00', 20, 'active'),
  -- Wednesday 6 AM
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 3, '06:00:00', '07:00:00', 20, 'active'),
  -- Thursday 6 AM
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 4, '06:00:00', '07:00:00', 20, 'active'),
  -- Friday 6 AM
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 5, '06:00:00', '07:00:00', 20, 'active'),
  -- Saturday 9 AM
  ('0b2179f6-d78c-4d61-a80d-abadaa316262', 6, '09:00:00', '10:00:00', 20, 'active')
ON CONFLICT (class_id, day_of_week, start_time) DO NOTHING;

-- STEP 4: Verify the inserts worked
SELECT 
  s.id,
  c.name as class_name,
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
  s.capacity,
  s.status
FROM schedule_slots s
JOIN classes c ON s.class_id = c.id
ORDER BY c.name, s.day_of_week, s.start_time;

-- STEP 5: Count total slots
SELECT 
  c.name,
  COUNT(s.id) as num_slots
FROM classes c
LEFT JOIN schedule_slots s ON c.class_id = s.class_id
WHERE c.status = 'active'
GROUP BY c.name
ORDER BY c.name;

/*
==========================================
TROUBLESHOOTING
==========================================

If you get constraint violation errors:

1. Check the constraint definition from STEP 1
2. The constraint might require:
   - day_of_week BETWEEN 0 AND 6
   - day_of_week >= 0 AND day_of_week <= 6
   - day_of_week IN (0,1,2,3,4,5,6)

3. Common issues:
   - NULL day_of_week (use NOT NULL)
   - day_of_week = 7 (only 0-6 allowed)
   - Wrong data type (should be INTEGER or SMALLINT)

4. To see failed row details, check the error:
   "Failing row contains (...)" shows actual values

==========================================
ALTERNATIVE: Bulk insert for ALL classes
==========================================

Run this AFTER testing with one class above:
*/

-- Bulk create slots for ALL classes
INSERT INTO schedule_slots (class_id, day_of_week, start_time, end_time, capacity, status)
SELECT 
  c.id,
  d.day_num,
  d.start_time,
  (d.start_time + (COALESCE(c.duration_minutes, 60) || ' minutes')::INTERVAL)::TIME as end_time,
  20 as capacity,
  'active' as status
FROM classes c
CROSS JOIN (
  VALUES 
    (1, '06:00:00'::TIME),  -- Monday 6 AM
    (2, '06:00:00'::TIME),  -- Tuesday 6 AM
    (3, '06:00:00'::TIME),  -- Wednesday 6 AM
    (4, '06:00:00'::TIME),  -- Thursday 6 AM
    (5, '06:00:00'::TIME),  -- Friday 6 AM
    (6, '09:00:00'::TIME)   -- Saturday 9 AM
) AS d(day_num, start_time)
WHERE c.status = 'active'
ON CONFLICT (class_id, day_of_week, start_time) DO NOTHING;

-- Verify bulk insert
SELECT COUNT(*) as total_slots_created FROM schedule_slots;
