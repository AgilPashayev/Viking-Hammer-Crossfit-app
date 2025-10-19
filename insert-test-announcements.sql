-- ============================================================================
-- INSERT TEST ANNOUNCEMENTS FOR VIKING HAMMER CROSSFIT
-- ============================================================================
-- Purpose: Create test announcements to verify Member Dashboard display
-- Date: October 19, 2025
-- Instructions: 
--   1. Open Supabase Dashboard > SQL Editor
--   2. First, run the "Get User ID" query to get a real user ID
--   3. Copy one of the user IDs
--   4. Replace 'PASTE-USER-ID-HERE' below with the actual UUID
--   5. Run the INSERT query
-- ============================================================================

-- STEP 1: Get a real user ID from your database
-- Copy one of the IDs from the results
SELECT 
  id,
  email,
  role,
  full_name
FROM public.users_profile
WHERE role IN ('admin', 'reception', 'sparta', 'member')
LIMIT 10;

-- ============================================================================
-- STEP 2: Insert test announcements
-- IMPORTANT: Replace 'PASTE-USER-ID-HERE' with an actual UUID from Step 1
-- ============================================================================

INSERT INTO public.announcements (
  title,
  content,
  target_audience,
  priority,
  status,
  created_by,
  published_at,
  created_at,
  updated_at
)
VALUES
-- Announcement 1: High Priority from Reception
(
  '🏋️ New CrossFit Class Schedule - FROM RECEPTION',
  'Exciting news! We have added new morning CrossFit classes starting next week Monday through Friday at 6:00 AM. Perfect for early risers! Check the schedule board for complete details and sign up at the front desk. Limited spots available for the first week.',
  'members',
  'high',
  'published',
  'PASTE-USER-ID-HERE',  -- ← REPLACE THIS
  NOW(),
  NOW(),
  NOW()
),

-- Announcement 2: Urgent Priority from Sparta
(
  '⚔️ Sparta Challenge This Weekend - FROM SPARTA',
  'Join us for the ultimate Sparta Challenge this Saturday at 9:00 AM! Test your strength, endurance, and mental determination in our toughest workout yet. This is not for the faint of heart! Sign up at the front desk. Limited to 20 participants. Prize for top 3 finishers!',
  'members',
  'urgent',
  'published',
  'PASTE-USER-ID-HERE',  -- ← REPLACE THIS
  NOW(),
  NOW(),
  NOW()
),

-- Announcement 3: Normal Priority for All
(
  '📢 Welcome to Viking Hammer CrossFit!',
  'This is a test announcement to verify the popup modal and push notification system. You should see this message in your Member Dashboard immediately upon login. Click the "Enable Push Notifications" button to receive future updates directly to your device. Thank you for being part of our community!',
  'all',
  'normal',
  'published',
  'PASTE-USER-ID-HERE',  -- ← REPLACE THIS
  NOW(),
  NOW(),
  NOW()
),

-- Announcement 4: Info message
(
  'ℹ️ Gym Maintenance Schedule',
  'Please note that the gym will undergo routine maintenance next Tuesday from 2:00 PM to 4:00 PM. All equipment will be inspected and serviced. We appreciate your patience!',
  'all',
  'low',
  'published',
  'PASTE-USER-ID-HERE',  -- ← REPLACE THIS
  NOW(),
  NOW(),
  NOW()
);

-- ============================================================================
-- STEP 3: Verify announcements were created
-- ============================================================================

SELECT 
  id,
  title,
  target_audience,
  priority,
  status,
  published_at,
  created_at
FROM public.announcements
ORDER BY published_at DESC
LIMIT 10;

-- ============================================================================
-- EXPECTED RESULTS:
-- - 4 announcements created
-- - All with status = 'published'
-- - Different priorities: high, urgent, normal, low
-- - Target audiences: members, all
-- - All published_at timestamps set to NOW()
-- ============================================================================

-- ============================================================================
-- NEXT STEPS FOR TESTING:
-- ============================================================================
-- 1. Open frontend: http://localhost:5173
-- 2. Login as MEMBER user
-- 3. You should immediately see announcement popup modal with 4 announcements
-- 4. Click "Enable Push Notifications" button
-- 5. Grant permission when browser prompts
-- 6. Test notification should appear: "Notifications Enabled! 🎉"
-- 7. Click "Got it!" to close modal
-- 8. Announcements are now marked as read
-- 9. Refresh page (F5) - popup should NOT appear again
-- 10. Announcements still visible in dashboard section
-- ============================================================================
