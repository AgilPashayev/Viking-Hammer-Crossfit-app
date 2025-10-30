-- ============================================================================
-- STEP-BY-STEP FIX FOR schedule_slots TABLE
-- ============================================================================
-- Run each section ONE AT A TIME in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete all existing rows (they have TEXT day names like "Tuesday")
-- ============================================================================
DELETE FROM schedule_slots;

-- ============================================================================
-- STEP 2: Drop the broken constraint
-- ============================================================================
ALTER TABLE schedule_slots 
DROP CONSTRAINT IF EXISTS schedule_slots_day_of_week_check;

-- ============================================================================
-- STEP 3: Fix the column type (TEXT → INTEGER)
-- ============================================================================
ALTER TABLE schedule_slots 
ALTER COLUMN day_of_week TYPE INTEGER 
USING CASE 
    WHEN day_of_week ~ '^\d+$' THEN day_of_week::INTEGER
    ELSE NULL
END;

-- ============================================================================
-- STEP 4: Add correct constraint (0-6 for Sunday-Saturday)
-- ============================================================================
ALTER TABLE schedule_slots 
ADD CONSTRAINT schedule_slots_day_of_week_check 
CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- ============================================================================
-- STEP 5: Get the first class ID (copy the result for next step)
-- ============================================================================
SELECT id, name, description 
FROM classes 
LIMIT 1;

-- ============================================================================
-- STEP 6: Insert test data
-- REPLACE 'YOUR-CLASS-ID-HERE' with the ID from STEP 5
-- ============================================================================
-- EXAMPLE:
-- INSERT INTO schedule_slots (class_id, day_of_week, start_time, end_time)
-- VALUES
--     ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, '06:00:00', '07:00:00');

-- Copy and modify this template:
INSERT INTO schedule_slots (class_id, day_of_week, start_time, end_time)
VALUES
    ('YOUR-CLASS-ID-HERE', 1, '06:00:00', '07:00:00'),  -- Monday 6 AM
    ('YOUR-CLASS-ID-HERE', 2, '06:00:00', '07:00:00'),  -- Tuesday 6 AM
    ('YOUR-CLASS-ID-HERE', 3, '06:00:00', '07:00:00'),  -- Wednesday 6 AM
    ('YOUR-CLASS-ID-HERE', 4, '06:00:00', '07:00:00'),  -- Thursday 6 AM
    ('YOUR-CLASS-ID-HERE', 5, '06:00:00', '07:00:00'),  -- Friday 6 AM
    ('YOUR-CLASS-ID-HERE', 6, '09:00:00', '10:00:00');  -- Saturday 9 AM

-- ============================================================================
-- STEP 7: Verify the fix
-- ============================================================================
SELECT 
    id,
    class_id,
    day_of_week,
    CASE day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS day_name,
    start_time,
    end_time,
    instructor_id,
    created_at
FROM schedule_slots
ORDER BY day_of_week, start_time;

-- Expected: 6 rows with day_of_week as integers (1-6)
