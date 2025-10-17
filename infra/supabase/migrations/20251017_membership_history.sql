-- =====================================================
-- MEMBERSHIP HISTORY SYSTEM
-- Migration: 20251017_membership_history.sql
-- Purpose: Track complete membership lifecycle and history
-- =====================================================

-- =====================================================
-- 1. CREATE MEMBERSHIP HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS membership_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Membership Details
  plan_name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) NOT NULL, -- 'basic', 'premium', 'elite', 'trial'
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE,
  duration_months INTEGER, -- null for ongoing
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'completed', 'pending')),
  
  -- Financial
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50), -- 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'free'
  payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed', 'refunded')),
  transaction_id VARCHAR(100),
  
  -- Renewal
  renewal_type VARCHAR(30) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'one-time', 'auto-renew'
  auto_renew BOOLEAN DEFAULT false,
  next_billing_date DATE,
  
  -- Benefits
  class_limit INTEGER, -- null = unlimited
  guest_passes INTEGER DEFAULT 0,
  personal_training_sessions INTEGER DEFAULT 0,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES user_profiles(id),
  cancellation_reason TEXT,
  
  -- Notes
  notes TEXT
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_membership_history_user_id ON membership_history(user_id);
CREATE INDEX idx_membership_history_status ON membership_history(status);
CREATE INDEX idx_membership_history_start_date ON membership_history(start_date DESC);
CREATE INDEX idx_membership_history_end_date ON membership_history(end_date);
CREATE INDEX idx_membership_history_user_status ON membership_history(user_id, status);

-- =====================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_membership_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_membership_history_updated_at
  BEFORE UPDATE ON membership_history
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_history_updated_at();

-- =====================================================
-- 4. STORED PROCEDURE: GET USER MEMBERSHIP HISTORY
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_membership_history(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  plan_name VARCHAR(100),
  plan_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  duration_months INTEGER,
  status VARCHAR(20),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  payment_method VARCHAR(50),
  payment_status VARCHAR(20),
  renewal_type VARCHAR(30),
  auto_renew BOOLEAN,
  next_billing_date DATE,
  class_limit INTEGER,
  created_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mh.id,
    mh.plan_name,
    mh.plan_type,
    mh.start_date,
    mh.end_date,
    mh.duration_months,
    mh.status,
    mh.amount,
    mh.currency,
    mh.payment_method,
    mh.payment_status,
    mh.renewal_type,
    mh.auto_renew,
    mh.next_billing_date,
    mh.class_limit,
    mh.created_at,
    mh.cancelled_at,
    mh.cancellation_reason
  FROM membership_history mh
  WHERE mh.user_id = p_user_id
  ORDER BY mh.start_date DESC, mh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. STORED PROCEDURE: GET ACTIVE MEMBERSHIP
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_membership(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  plan_name VARCHAR(100),
  plan_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  amount DECIMAL(10, 2),
  renewal_type VARCHAR(30),
  auto_renew BOOLEAN,
  next_billing_date DATE,
  class_limit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mh.id,
    mh.plan_name,
    mh.plan_type,
    mh.start_date,
    mh.end_date,
    mh.amount,
    mh.renewal_type,
    mh.auto_renew,
    mh.next_billing_date,
    mh.class_limit
  FROM membership_history mh
  WHERE mh.user_id = p_user_id
    AND mh.status = 'active'
  ORDER BY mh.start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. STORED PROCEDURE: CREATE MEMBERSHIP RECORD
-- =====================================================
CREATE OR REPLACE FUNCTION create_membership_record(
  p_user_id UUID,
  p_plan_name VARCHAR(100),
  p_plan_type VARCHAR(50),
  p_start_date DATE,
  p_end_date DATE,
  p_duration_months INTEGER,
  p_amount DECIMAL(10, 2),
  p_payment_method VARCHAR(50),
  p_renewal_type VARCHAR(30),
  p_auto_renew BOOLEAN DEFAULT false,
  p_class_limit INTEGER DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_membership_id UUID;
  v_next_billing DATE;
BEGIN
  -- Calculate next billing date
  IF p_auto_renew THEN
    v_next_billing := p_start_date + INTERVAL '1 month' * COALESCE(p_duration_months, 1);
  ELSE
    v_next_billing := NULL;
  END IF;

  -- Insert membership record
  INSERT INTO membership_history (
    user_id,
    plan_name,
    plan_type,
    start_date,
    end_date,
    duration_months,
    status,
    amount,
    payment_method,
    payment_status,
    renewal_type,
    auto_renew,
    next_billing_date,
    class_limit,
    created_by
  ) VALUES (
    p_user_id,
    p_plan_name,
    p_plan_type,
    p_start_date,
    p_end_date,
    p_duration_months,
    'active',
    p_amount,
    p_payment_method,
    'paid',
    p_renewal_type,
    p_auto_renew,
    v_next_billing,
    p_class_limit,
    COALESCE(p_created_by, p_user_id)
  )
  RETURNING id INTO v_membership_id;

  RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. STORED PROCEDURE: UPDATE MEMBERSHIP STATUS
-- =====================================================
CREATE OR REPLACE FUNCTION update_membership_status(
  p_membership_id UUID,
  p_status VARCHAR(20),
  p_cancelled_by UUID DEFAULT NULL,
  p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE membership_history
  SET 
    status = p_status,
    cancelled_at = CASE WHEN p_status = 'cancelled' THEN NOW() ELSE cancelled_at END,
    cancelled_by = CASE WHEN p_status = 'cancelled' THEN p_cancelled_by ELSE cancelled_by END,
    cancellation_reason = CASE WHEN p_status = 'cancelled' THEN p_cancellation_reason ELSE cancellation_reason END
  WHERE id = p_membership_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. STORED PROCEDURE: AUTO-EXPIRE MEMBERSHIPS
-- =====================================================
CREATE OR REPLACE FUNCTION auto_expire_memberships()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE membership_history
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date IS NOT NULL
    AND end_date < CURRENT_DATE;

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE membership_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own membership history
CREATE POLICY membership_history_select_own ON membership_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins/Reception can view all membership history
CREATE POLICY membership_history_select_admin ON membership_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reception')
    )
  );

-- Policy: Only admins/reception can insert membership records
CREATE POLICY membership_history_insert_admin ON membership_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reception')
    )
  );

-- Policy: Only admins/reception can update membership records
CREATE POLICY membership_history_update_admin ON membership_history
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reception')
    )
  );

-- =====================================================
-- 10. SEED DATA (FOR TESTING)
-- =====================================================
-- Note: This will be inserted via separate seed script
-- For now, we'll add sample data for existing users

COMMENT ON TABLE membership_history IS 'Tracks complete membership lifecycle including active, expired, and cancelled memberships';
COMMENT ON COLUMN membership_history.status IS 'active: currently active, expired: past end date, cancelled: manually cancelled, completed: finished successfully, pending: awaiting activation';
COMMENT ON COLUMN membership_history.class_limit IS 'Number of classes allowed per month. NULL = unlimited';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
