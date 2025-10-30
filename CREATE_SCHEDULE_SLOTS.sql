-- CREATE SCHEDULE SLOTS FOR EXISTING CLASSES
-- This populates the schedule_slots table based on existing classes
-- Run this in Supabase SQL Editor

-- First, check the day_of_week constraint
-- Run this to see what values are allowed:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'schedule_slots'::regclass;

-- Day of week mapping (JavaScript style):
-- 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday

-- First, let's check what classes exist
SELECT id, name, duration_minutes FROM classes WHERE status = 'active' LIMIT 10;

-- Create schedule slots for all active classes
-- Creates Mon-Fri morning slots + Saturday slot
DO $$
DECLARE
  class_record RECORD;
  calculated_end_time TIME;
BEGIN
  -- Loop through all active classes
  FOR class_record IN 
    SELECT id, name, duration_minutes 
    FROM classes 
    WHERE status = 'active'
  LOOP
    -- Calculate end time based on duration
    calculated_end_time := (TIME '06:00:00' + (COALESCE(class_record.duration_minutes, 60) || ' minutes')::INTERVAL)::TIME;
    
    -- Create Monday to Friday slots at 6:00 AM (days 1-5)
    FOR day_num IN 1..5 LOOP
      INSERT INTO schedule_slots (
        class_id,
        day_of_week,
        start_time,
        end_time,
        capacity,
        status,
        created_at,
        updated_at
      ) VALUES (
        class_record.id,
        day_num,
        '06:00:00',
        calculated_end_time,
        20,
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (class_id, day_of_week, start_time) DO NOTHING;
    END LOOP;
    
    -- Create Saturday slot at 9:00 AM (day 6)
    calculated_end_time := (TIME '09:00:00' + (COALESCE(class_record.duration_minutes, 60) || ' minutes')::INTERVAL)::TIME;
    
    INSERT INTO schedule_slots (
      class_id,
      day_of_week,
      start_time,
      end_time,
      capacity,
      status,
      created_at,
      updated_at
    ) VALUES (
      class_record.id,
      6,
      '09:00:00',
      calculated_end_time,
      20,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (class_id, day_of_week, start_time) DO NOTHING;
    
    RAISE NOTICE 'Created slots for class: % (duration: % min)', class_record.name, COALESCE(class_record.duration_minutes, 60);
  END LOOP;
  
  RAISE NOTICE 'Done! Created schedule slots for all active classes.';
END $$;

-- Verify created slots
SELECT 
  s.id,
  c.name as class_name,
  s.day_of_week,
  s.start_time,
  s.end_time,
  s.capacity,
  s.status
FROM schedule_slots s
JOIN classes c ON s.class_id = c.id
ORDER BY c.name, s.day_of_week, s.start_time
LIMIT 20;

-- Count total slots created
SELECT COUNT(*) as total_schedule_slots FROM schedule_slots;

/*
MANUAL ALTERNATIVE:
If the above script doesn't work, manually create slots like this:

INSERT INTO schedule_slots (
  class_id,
  day_of_week,
  start_time,
  end_time,
  capacity,
  status
) VALUES 
  -- Replace 'your-class-id' with actual class UUID from classes table
  ('your-class-id', 1, '06:00:00', '07:00:00', 20, 'active'), -- Monday 6 AM
  ('your-class-id', 2, '06:00:00', '07:00:00', 20, 'active'), -- Tuesday 6 AM
  ('your-class-id', 3, '06:00:00', '07:00:00', 20, 'active'), -- Wednesday 6 AM
  ('your-class-id', 4, '06:00:00', '07:00:00', 20, 'active'), -- Thursday 6 AM
  ('your-class-id', 5, '06:00:00', '07:00:00', 20, 'active'), -- Friday 6 AM
  ('your-class-id', 6, '09:00:00', '10:00:00', 20, 'active'); -- Saturday 9 AM
*/
