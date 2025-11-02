-- Migration: Create activity_log table for persistent activity tracking
-- This table stores all user activities (check-ins, profile updates, etc.)

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  member_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  updated_by_user_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  updated_by_name VARCHAR(255),
  updated_by_role VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_member_id ON activity_log(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_updated_by ON activity_log(updated_by_user_id);

-- Add comment to table
COMMENT ON TABLE activity_log IS 'Stores all user activities and system events for audit trail';
COMMENT ON COLUMN activity_log.type IS 'Activity type: member_updated, membership_changed, check_in, class_created, etc.';
COMMENT ON COLUMN activity_log.message IS 'Human-readable activity message';
COMMENT ON COLUMN activity_log.member_id IS 'The member this activity is about (if applicable)';
COMMENT ON COLUMN activity_log.updated_by_user_id IS 'The user who performed this action';
COMMENT ON COLUMN activity_log.updated_by_name IS 'Cached name of user who performed action';
COMMENT ON COLUMN activity_log.updated_by_role IS 'Cached role of user who performed action';
COMMENT ON COLUMN activity_log.metadata IS 'Additional structured data about the activity';
