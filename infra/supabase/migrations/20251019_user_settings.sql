-- User Settings Table Migration
-- Purpose: Store user notification preferences, theme settings, language, and push device tokens
-- Date: October 19, 2025

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  
  -- Notification preferences
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  push_device_token text,
  push_device_platform text CHECK (push_device_platform IN ('web', 'ios', 'android')),
  
  -- App preferences
  language text DEFAULT 'en' CHECK (language IN ('en', 'az', 'ru', 'tr')),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Add RLS (Row Level Security)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own settings
CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "user_settings_insert_own" ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can read all settings
CREATE POLICY "user_settings_select_admin" ON public.user_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT ON public.user_settings TO anon;

-- Comment on table
COMMENT ON TABLE public.user_settings IS 'Stores user-specific settings and preferences including notifications, theme, and language';
COMMENT ON COLUMN public.user_settings.user_id IS 'Foreign key to users_profile';
COMMENT ON COLUMN public.user_settings.email_notifications IS 'Enable/disable email notifications';
COMMENT ON COLUMN public.user_settings.sms_notifications IS 'Enable/disable SMS notifications';
COMMENT ON COLUMN public.user_settings.push_notifications IS 'Enable/disable push notifications';
COMMENT ON COLUMN public.user_settings.push_device_token IS 'Device token for push notifications (FCM/APNs)';
COMMENT ON COLUMN public.user_settings.language IS 'User interface language preference';
COMMENT ON COLUMN public.user_settings.theme IS 'UI theme preference (light/dark mode)';
