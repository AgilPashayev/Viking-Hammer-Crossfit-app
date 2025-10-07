-- Migration: Create user_profiles table for Viking Hammer CrossFit App
-- Date: 2025-10-07
-- Description: User profile management with authentication integration

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country_code VARCHAR(10) NOT NULL DEFAULT '+994',
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  emergency_contact_name VARCHAR(200) NOT NULL,
  emergency_contact_phone VARCHAR(20) NOT NULL,
  emergency_contact_country_code VARCHAR(10) NOT NULL DEFAULT '+994',
  membership_type VARCHAR(100) NOT NULL DEFAULT 'Viking Warrior Basic',
  join_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_join_date ON user_profiles(join_date);
CREATE INDEX idx_user_profiles_membership_type ON user_profiles(membership_type);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);

-- Insert sample data for testing (optional)
-- Note: These would normally be created through the signup process
-- INSERT INTO user_profiles (
--   id, email, first_name, last_name, phone, country_code, 
--   date_of_birth, gender, emergency_contact_name, 
--   emergency_contact_phone, emergency_contact_country_code, 
--   membership_type
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'erik.andersson@email.com',
--   'Erik',
--   'Andersson',
--   '501234567',
--   '+994',
--   '1990-05-15',
--   'Male',
--   'Anna Andersson',
--   '509876543',
--   '+994',
--   'Viking Warrior Premium'
-- );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;