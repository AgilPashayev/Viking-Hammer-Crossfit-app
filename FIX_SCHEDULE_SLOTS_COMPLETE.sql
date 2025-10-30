-- ============================================================================
-- COMPLETE FIX FOR schedule_slots TABLE
-- ============================================================================
-- Issue: day_of_week column has TEXT values like "Tuesday" instead of INTEGER (0-6)
-- Solution: Delete all existing data, fix column type, insert correct data
-- ============================================================================

-- STEP 1: Check current data (for reference)
-- ============================================================================
SELECT 
    id,
    class_id,
    day_of_week,
    start_time,
    end_time,
    max_capacity
FROM schedule_slots
ORDER BY created_at DESC
LIMIT 10;

-- STEP 2: DELETE ALL EXISTING ROWS (they have wrong data type)
-- ============================================================================
-- This is safe because:
-- 1. The table has TEXT values that can't be converted to INTEGER
-- 2. It's test data only (no production bookings exist yet)
-- 3. We'll insert correct data after fixing the schema
DELETE FROM schedule_slots;

-- Verify deletion
SELECT COUNT(*) AS remaining_rows FROM schedule_slots;
-- Expected: 0

-- STEP 3: DROP THE BROKEN CONSTRAINT
-- ============================================================================
ALTER TABLE schedule_slots 
DROP CONSTRAINT IF EXISTS schedule_slots_day_of_week_check;

-- STEP 4: FIX THE COLUMN TYPE (TEXT → INTEGER)
-- ============================================================================
-- Since table is now empty, we can safely alter the column type
ALTER TABLE schedule_slots 
ALTER COLUMN day_of_week TYPE INTEGER 
USING CASE 
    WHEN day_of_week ~ '^\d+$' THEN day_of_week::INTEGER
    ELSE NULL
END;

-- STEP 5: ADD CORRECT CONSTRAINT (0-6 for Sunday-Saturday)
-- ============================================================================
ALTER TABLE schedule_slots 
ADD CONSTRAINT schedule_slots_day_of_week_check 
CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- STEP 6: INSERT CORRECT TEST DATA
-- ============================================================================
-- Get the CrossFit class ID first
DO $$
DECLARE
    v_crossfit_class_id UUID;
BEGIN
    -- Find CrossFit class
    SELECT id INTO v_crossfit_class_id
    FROM classes
    WHERE name = 'CrossFit' OR name ILIKE '%crossfit%'
    LIMIT 1;

    -- If no CrossFit class found, use the first available class
    IF v_crossfit_class_id IS NULL THEN
        SELECT id INTO v_crossfit_class_id
        FROM classes
        LIMIT 1;
    END IF;

    -- Insert schedule slots with INTEGER day_of_week values
    -- day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    
    INSERT INTO schedule_slots (class_id, day_of_week, start_time, end_time, max_capacity, instructor_id)
    VALUES
        -- Monday 6:00 AM - 7:00 AM
        (v_crossfit_class_id, 1, '06:00:00', '07:00:00', 20, NULL),
        
        -- Tuesday 6:00 AM - 7:00 AM
        (v_crossfit_class_id, 2, '06:00:00', '07:00:00', 20, NULL),
        
        -- Wednesday 6:00 AM - 7:00 AM
        (v_crossfit_class_id, 3, '06:00:00', '07:00:00', 20, NULL),
        
        -- Thursday 6:00 AM - 7:00 AM
        (v_crossfit_class_id, 4, '06:00:00', '07:00:00', 20, NULL),
        
        -- Friday 6:00 AM - 7:00 AM
        (v_crossfit_class_id, 5, '06:00:00', '07:00:00', 20, NULL),
        
        -- Saturday 9:00 AM - 10:00 AM
        (v_crossfit_class_id, 6, '09:00:00', '10:00:00', 20, NULL);

    RAISE NOTICE 'Inserted 6 schedule slots for class_id: %', v_crossfit_class_id;
END $$;

-- STEP 7: VERIFY THE FIX
-- ============================================================================

-- Check column type
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'schedule_slots' 
  AND column_name = 'day_of_week';
-- Expected: data_type = 'integer'

-- Check constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'schedule_slots'::regclass
  AND conname LIKE '%day_of_week%';
-- Expected: CHECK ((day_of_week >= 0) AND (day_of_week <= 6))

-- Check inserted data
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
    max_capacity,
    created_at
FROM schedule_slots
ORDER BY day_of_week, start_time;
-- Expected: 6 rows with day_of_week as integers (1-6)

-- Final count
SELECT COUNT(*) AS total_schedule_slots FROM schedule_slots;
-- Expected: 6

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
-- ✅ day_of_week column is INTEGER type (not TEXT)
-- ✅ Constraint allows only 0-6 (Sunday-Saturday)
-- ✅ 6 schedule slots exist with correct INTEGER values
-- ✅ Ready for class booking functionality
-- ============================================================================
