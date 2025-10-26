-- 20251026_fix_membership_system.sql
-- Fix membership type system and add proper constraints

-- ==========================================
-- STEP 1: Create default membership plans if they don't exist
-- ==========================================

-- Insert default plans (ignore if already exist)
INSERT INTO plans (sku, name, price_cents, duration_days, visit_quota, metadata)
VALUES 
  ('plan_single_session', 'Single Session', 1500, 1, 1, '{"type": "single", "currency": "AZN", "description": "One-time gym session", "features": ["1 gym visit", "Access to all equipment"], "limitations": ["Valid for 1 day"], "isActive": true, "isPopular": false}'),
  ('plan_monthly_limited', 'Monthly Limited', 8000, 30, 12, '{"type": "monthly-limited", "currency": "AZN", "description": "12 visits per month", "features": ["12 gym visits per month", "Access to all equipment", "Group classes included"], "limitations": ["12 visits maximum", "Valid for 30 days"], "isActive": true, "isPopular": false}'),
  ('plan_monthly_unlimited', 'Monthly Unlimited', 12000, 30, null, '{"type": "monthly-unlimited", "currency": "AZN", "description": "Unlimited visits for 30 days", "features": ["Unlimited gym visits", "Access to all equipment", "All group classes included", "Free locker"], "limitations": ["Valid for 30 days"], "isActive": true, "isPopular": true}'),
  ('plan_company_basic', 'Company Basic', 8000, 30, null, '{"type": "company", "currency": "AZN", "description": "Corporate membership - Basic tier", "features": ["Unlimited gym visits", "Access to all equipment", "Group classes included", "Corporate wellness reports"], "limitations": ["Valid for 30 days", "Minimum 10 employees"], "isActive": true, "isPopular": false, "discountPercentage": 15}')
ON CONFLICT (sku) DO NOTHING;


-- ==========================================
-- STEP 2: Update invalid membership types in users_profile
-- ==========================================

-- Update "Viking Warrior Basic" to "Monthly Limited"
UPDATE users_profile
SET membership_type = 'Monthly Limited'
WHERE membership_type = 'Viking Warrior Basic';

-- Update "Viking Warrior Pro" to "Monthly Unlimited"
UPDATE users_profile
SET membership_type = 'Monthly Unlimited'
WHERE membership_type = 'Viking Warrior Pro';

-- Update any other invalid types to default
UPDATE users_profile
SET membership_type = 'Monthly Unlimited'
WHERE membership_type NOT IN ('Single Session', 'Monthly Limited', 'Monthly Unlimited', 'Company Basic', 'Staff')
  AND role = 'member';


-- ==========================================
-- STEP 3: Create lookup function to validate membership types
-- ==========================================

-- Function to get valid membership type names
CREATE OR REPLACE FUNCTION get_valid_membership_types()
RETURNS TABLE(membership_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT name FROM plans WHERE metadata->>'isActive' = 'true'
  UNION ALL
  SELECT 'Staff' AS name; -- Allow Staff as special type
END;
$$ LANGUAGE plpgsql STABLE;


-- ==========================================
-- STEP 4: Add check constraint for membership_type
-- ==========================================

-- Drop existing constraint if it exists
ALTER TABLE users_profile 
DROP CONSTRAINT IF EXISTS users_profile_membership_type_check;

-- Add constraint to only allow valid plan names or 'Staff'
-- Note: This uses a subquery which PostgreSQL allows in CHECK constraints
ALTER TABLE users_profile
ADD CONSTRAINT users_profile_membership_type_check
CHECK (
  membership_type IS NULL 
  OR membership_type IN (
    SELECT name FROM plans 
    UNION ALL 
    SELECT 'Staff'
  )
);


-- ==========================================
-- STEP 5: Create trigger to auto-sync membership_type from memberships table
-- ==========================================

-- Function to sync membership_type when membership is created/updated
CREATE OR REPLACE FUNCTION sync_membership_type()
RETURNS TRIGGER AS $$
DECLARE
  plan_name text;
BEGIN
  -- Get the plan name from the plans table
  SELECT name INTO plan_name
  FROM plans
  WHERE id = NEW.plan_id;

  -- Update the user's membership_type
  IF plan_name IS NOT NULL AND NEW.status = 'active' THEN
    UPDATE users_profile
    SET membership_type = plan_name
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on memberships table
DROP TRIGGER IF EXISTS trigger_sync_membership_type ON memberships;
CREATE TRIGGER trigger_sync_membership_type
AFTER INSERT OR UPDATE ON memberships
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION sync_membership_type();


-- ==========================================
-- STEP 6: Create indexes for performance
-- ==========================================

-- Index on memberships for faster lookups
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON memberships(user_id, status);

-- Index on plans for faster validation
CREATE INDEX IF NOT EXISTS idx_plans_name ON plans(name);


-- ==========================================
-- STEP 7: Create view for active user memberships
-- ==========================================

CREATE OR REPLACE VIEW v_active_memberships AS
SELECT 
  m.id as membership_id,
  m.user_id,
  u.name as user_name,
  u.email as user_email,
  p.id as plan_id,
  p.name as plan_name,
  p.price_cents,
  p.duration_days,
  p.visit_quota,
  m.start_date,
  m.end_date,
  m.remaining_visits,
  m.status,
  m.notes,
  m.created_at
FROM memberships m
JOIN users_profile u ON m.user_id = u.id
JOIN plans p ON m.plan_id = p.id
WHERE m.status = 'active'
  AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE);


-- ==========================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ==========================================

-- Check all membership types in use:
-- SELECT DISTINCT membership_type FROM users_profile WHERE membership_type IS NOT NULL;

-- Check all plans:
-- SELECT id, sku, name, price_cents/100.0 as price_azn, duration_days, visit_quota FROM plans;

-- Check active memberships:
-- SELECT * FROM v_active_memberships;

-- Verify constraint works:
-- UPDATE users_profile SET membership_type = 'Invalid Type' WHERE id = 'some-uuid'; -- Should fail
