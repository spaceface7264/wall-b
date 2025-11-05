-- User Suspensions Schema
-- Run this in your Supabase SQL Editor

-- Create user_suspensions table
CREATE TABLE IF NOT EXISTS user_suspensions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  suspended_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means permanent suspension
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT, -- Additional notes from moderator
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add suspension tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_suspended_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS user_suspensions_user_id_idx ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS user_suspensions_is_active_idx ON user_suspensions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS user_suspensions_expires_at_idx ON user_suspensions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_suspensions_suspended_at_idx ON user_suspensions(suspended_at DESC);

-- Enable Row Level Security
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can view all, users can view their own
DROP POLICY IF EXISTS "Users can view their own suspensions" ON user_suspensions;
CREATE POLICY "Users can view their own suspensions" ON user_suspensions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can manage suspensions" ON user_suspensions;
CREATE POLICY "Admins can manage suspensions" ON user_suspensions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- Function to automatically expire suspensions
CREATE OR REPLACE FUNCTION expire_suspensions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE user_suspensions
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE is_active = TRUE
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update suspension count in profiles
CREATE OR REPLACE FUNCTION update_suspension_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
    UPDATE profiles
    SET 
      suspension_count = suspension_count + 1,
      last_suspended_at = NEW.suspended_at
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    -- Suspension was deactivated, but don't decrease count (historical record)
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update suspension count
DROP TRIGGER IF EXISTS update_suspension_count_trigger ON user_suspensions;
CREATE TRIGGER update_suspension_count_trigger
  AFTER INSERT OR UPDATE ON user_suspensions
  FOR EACH ROW EXECUTE FUNCTION update_suspension_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_suspensions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_user_suspensions_updated_at_trigger ON user_suspensions;
CREATE TRIGGER update_user_suspensions_updated_at_trigger
  BEFORE UPDATE ON user_suspensions
  FOR EACH ROW EXECUTE FUNCTION update_user_suspensions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_suspensions IS 'Tracks user suspensions (temporary bans)';
COMMENT ON COLUMN user_suspensions.expires_at IS 'When the suspension expires. NULL means permanent suspension.';
COMMENT ON COLUMN user_suspensions.is_active IS 'Whether the suspension is currently active';
COMMENT ON COLUMN profiles.suspension_count IS 'Total number of times this user has been suspended';
COMMENT ON COLUMN profiles.last_suspended_at IS 'Date of the most recent suspension';

-- Test the table creation
SELECT 'User suspensions table created successfully!' as status;
