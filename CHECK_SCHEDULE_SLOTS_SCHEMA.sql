-- ============================================================================
-- CHECK schedule_slots TABLE STRUCTURE
-- ============================================================================

-- Get all columns and their types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'schedule_slots'
ORDER BY ordinal_position;
