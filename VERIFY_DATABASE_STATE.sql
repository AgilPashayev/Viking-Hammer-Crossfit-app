-- ============================================================================
-- VERIFY DATABASE STATE FOR CLASS BOOKING
-- ============================================================================

-- Check if we have classes
SELECT 
    id, 
    name, 
    status,
    max_capacity
FROM classes
LIMIT 5;

-- Check if we have schedule slots
SELECT 
    id,
    class_id,
    day_of_week,
    start_time,
    end_time
FROM schedule_slots
ORDER BY day_of_week, start_time
LIMIT 10;

-- Check if we have instructors assigned to classes
SELECT 
    ci.class_id,
    c.name AS class_name,
    ci.instructor_id,
    i.first_name,
    i.last_name
FROM class_instructors ci
JOIN classes c ON c.id = ci.class_id
LEFT JOIN instructors i ON i.id = ci.instructor_id
LIMIT 10;

-- Check the structure returned by GET /api/classes query
SELECT 
    c.*,
    json_agg(
        json_build_object(
            'instructor', json_build_object(
                'id', i.id,
                'first_name', i.first_name,
                'last_name', i.last_name,
                'email', i.email
            )
        )
    ) FILTER (WHERE i.id IS NOT NULL) AS instructors,
    json_agg(
        json_build_object(
            'id', ss.id,
            'day_of_week', ss.day_of_week,
            'start_time', ss.start_time,
            'end_time', ss.end_time
        )
    ) FILTER (WHERE ss.id IS NOT NULL) AS schedule_slots
FROM classes c
LEFT JOIN class_instructors ci ON ci.class_id = c.id
LEFT JOIN instructors i ON i.id = ci.instructor_id
LEFT JOIN schedule_slots ss ON ss.class_id = c.id
GROUP BY c.id
LIMIT 3;
