-- User Blocks and Mutes Schema
-- Run this in your Supabase SQL Editor

-- Create user_blocks table for blocking users
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create user_mutes table for muting users (temporary blocks)
CREATE TABLE IF NOT EXISTS user_mutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  muter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(muter_id, muted_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS user_blocks_blocker_id_idx ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_id_idx ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS user_blocks_created_at_idx ON user_blocks(created_at DESC);

CREATE INDEX IF NOT EXISTS user_mutes_muter_id_idx ON user_mutes(muter_id);
CREATE INDEX IF NOT EXISTS user_mutes_muted_id_idx ON user_mutes(muted_id);
CREATE INDEX IF NOT EXISTS user_mutes_expires_at_idx ON user_mutes(expires_at) WHERE expires_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mutes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_blocks
DROP POLICY IF EXISTS "Users can view their own blocks" ON user_blocks;
CREATE POLICY "Users can view their own blocks" ON user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create their own blocks" ON user_blocks;
CREATE POLICY "Users can create their own blocks" ON user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete their own blocks" ON user_blocks;
CREATE POLICY "Users can delete their own blocks" ON user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- RLS Policies for user_mutes
DROP POLICY IF EXISTS "Users can view their own mutes" ON user_mutes;
CREATE POLICY "Users can view their own mutes" ON user_mutes
  FOR SELECT USING (auth.uid() = muter_id);

DROP POLICY IF EXISTS "Users can create their own mutes" ON user_mutes;
CREATE POLICY "Users can create their own mutes" ON user_mutes
  FOR INSERT WITH CHECK (auth.uid() = muter_id);

DROP POLICY IF EXISTS "Users can delete their own mutes" ON user_mutes;
CREATE POLICY "Users can delete their own mutes" ON user_mutes
  FOR DELETE USING (auth.uid() = muter_id);

DROP POLICY IF EXISTS "Users can update their own mutes" ON user_mutes;
CREATE POLICY "Users can update their own mutes" ON user_mutes
  FOR UPDATE USING (auth.uid() = muter_id);

-- Function to automatically delete expired mutes (can be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_mutes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_mutes
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE user_blocks IS 'Stores user-to-user blocks. Blocked users cannot see blocker content and vice versa.';
COMMENT ON TABLE user_mutes IS 'Stores user-to-user mutes. Muted users content is hidden but not blocked from interactions.';
COMMENT ON COLUMN user_mutes.expires_at IS 'Optional expiration date. NULL means mute is permanent until manually removed.';

-- Test the table creation
SELECT 'User blocks and mutes tables created successfully!' as status;
