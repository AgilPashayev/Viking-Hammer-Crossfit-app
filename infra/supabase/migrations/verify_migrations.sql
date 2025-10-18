-- MIGRATION VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor AFTER all migrations complete
-- This will verify everything is set up correctly

-- =====================================================
-- 1. CHECK ALL TABLES EXIST
-- =====================================================
SELECT 
  'Tables Check' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 15 tables'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- =====================================================
-- 2. LIST ALL TABLES
-- =====================================================
SELECT 
  '📋 ' || table_name AS table_list
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 3. VERIFY users_profile HAS REQUIRED COLUMNS
-- =====================================================
SELECT 
  'users_profile Columns' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing columns'
  END AS status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users_profile';

-- =====================================================
-- 4. VERIFY password_hash COLUMN EXISTS
-- =====================================================
SELECT 
  'password_hash Column' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users_profile' 
        AND column_name = 'password_hash'
    ) THEN '✅ PASS - Column exists'
    ELSE '❌ FAIL - Column missing (run 20251018_add_password_hash.sql)'
  END AS status;

-- =====================================================
-- 5. VERIFY role COLUMN EXISTS
-- =====================================================
SELECT 
  'role Column' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users_profile' 
        AND column_name = 'role'
    ) THEN '✅ PASS - Column exists'
    ELSE '❌ FAIL - Column missing (run 0001_init.sql)'
  END AS status;

-- =====================================================
-- 6. VERIFY CLASS SYSTEM TABLES
-- =====================================================
SELECT 
  'Class System Tables' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS - All class tables exist'
    ELSE '❌ FAIL - Missing tables (run 20251018_classes_instructors_schedule.sql)'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('instructors', 'classes', 'class_instructors', 'schedule_slots', 'class_bookings');

-- =====================================================
-- 7. VERIFY FOREIGN KEY CONSTRAINTS
-- =====================================================
SELECT 
  'Foreign Key Constraints' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS'
    ELSE '⚠️ WARNING - Some foreign keys may be missing'
  END AS status
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND constraint_type = 'FOREIGN KEY';

-- =====================================================
-- 8. VERIFY INDEXES
-- =====================================================
SELECT 
  'Indexes' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ PASS'
    ELSE '⚠️ WARNING - Some indexes may be missing'
  END AS status
FROM pg_indexes 
WHERE schemaname = 'public';

-- =====================================================
-- 9. CHECK membership_history REFERENCES
-- =====================================================
SELECT 
  'membership_history FKs' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'membership_history' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users_profile'
    ) THEN '✅ PASS - References users_profile correctly'
    ELSE '❌ FAIL - References wrong table (re-run 20251017_membership_history.sql)'
  END AS status;

-- =====================================================
-- 10. SUMMARY
-- =====================================================
SELECT 
  '=== MIGRATION VERIFICATION SUMMARY ===' AS summary,
  CURRENT_TIMESTAMP AS checked_at;

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 11. READY FOR BACKEND?
-- =====================================================
SELECT 
  'Backend Readiness' AS check_type,
  CASE 
    WHEN (
      -- Check users_profile exists with password_hash
      EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' AND column_name = 'password_hash'
      )
      -- Check class tables exist
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructors')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_slots')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_bookings')
    ) THEN '✅ READY - Start backend with: node backend-server.js'
    ELSE '❌ NOT READY - Complete migrations first'
  END AS status;
