-- Migration: Email Verification System
-- Date: 2025-10-16
-- Description: Add email verification fields and create verification tokens table

-- Add email verification fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create email_verification_tokens table for tracking verification attempts
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create index for quick token lookup
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Enable RLS on email_verification_tokens
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for email_verification_tokens
-- Only service role can manage verification tokens
CREATE POLICY "Service role can manage verification tokens" 
  ON email_verification_tokens 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Function to generate verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random 32-character token
  token := encode(gen_random_bytes(32), 'hex');
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create verification token for user
CREATE OR REPLACE FUNCTION create_verification_token(
  p_user_id UUID,
  p_email VARCHAR(255)
)
RETURNS TABLE (
  token VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_token VARCHAR(255);
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate token
  v_token := generate_verification_token();
  
  -- Set expiration to 24 hours from now
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Insert token
  INSERT INTO email_verification_tokens (
    user_id,
    token,
    email,
    expires_at
  ) VALUES (
    p_user_id,
    v_token,
    p_email,
    v_expires_at
  );
  
  -- Update user_profiles with token
  UPDATE user_profiles
  SET 
    verification_token = v_token,
    verification_token_expires_at = v_expires_at
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify email with token
CREATE OR REPLACE FUNCTION verify_email_with_token(p_token VARCHAR(255))
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  user_id UUID
) AS $$
DECLARE
  v_user_id UUID;
  v_token_record RECORD;
BEGIN
  -- Find token
  SELECT * INTO v_token_record
  FROM email_verification_tokens
  WHERE token = p_token
  AND used_at IS NULL
  LIMIT 1;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or already used verification token', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if token is expired
  IF v_token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Verification token has expired', NULL::UUID;
    RETURN;
  END IF;
  
  v_user_id := v_token_record.user_id;
  
  -- Mark token as used
  UPDATE email_verification_tokens
  SET used_at = NOW()
  WHERE token = p_token;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    email_verified = true,
    email_verified_at = NOW(),
    verification_token = NULL,
    verification_token_expires_at = NULL
  WHERE id = v_user_id;
  
  RETURN QUERY SELECT true, 'Email verified successfully', v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resend verification email (creates new token)
CREATE OR REPLACE FUNCTION resend_verification_token(p_user_id UUID)
RETURNS TABLE (
  token VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_email VARCHAR(255);
BEGIN
  -- Get user email
  SELECT email INTO v_email
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Mark old tokens as expired
  UPDATE email_verification_tokens
  SET used_at = NOW()
  WHERE user_id = p_user_id
  AND used_at IS NULL;
  
  -- Create new token
  RETURN QUERY SELECT * FROM create_verification_token(p_user_id, v_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verification_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index on email_verified for faster queries
CREATE INDEX idx_user_profiles_email_verified ON user_profiles(email_verified);

COMMENT ON TABLE email_verification_tokens IS 'Stores email verification tokens for user email confirmation';
COMMENT ON FUNCTION generate_verification_token() IS 'Generates a secure random verification token';
COMMENT ON FUNCTION create_verification_token(UUID, VARCHAR) IS 'Creates a new verification token for a user';
COMMENT ON FUNCTION verify_email_with_token(VARCHAR) IS 'Verifies user email using the provided token';
COMMENT ON FUNCTION resend_verification_token(UUID) IS 'Resends verification email by creating a new token';
COMMENT ON FUNCTION cleanup_expired_verification_tokens() IS 'Removes expired verification tokens older than 7 days';
