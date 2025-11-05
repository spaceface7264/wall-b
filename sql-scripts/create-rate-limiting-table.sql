-- Rate Limiting Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'post', 'comment', 'message', etc.
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS rate_limits_user_id_idx ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS rate_limits_action_type_idx ON rate_limits(action_type);
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx ON rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS rate_limits_user_action_idx ON rate_limits(user_id, action_type);

-- Enable Row Level Security
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view their own rate limits
DROP POLICY IF EXISTS "Users can view their own rate limits" ON rate_limits;
CREATE POLICY "Users can view their own rate limits" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update rate limits
DROP POLICY IF EXISTS "System can manage rate limits" ON rate_limits;
CREATE POLICY "System can manage rate limits" ON rate_limits
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to cleanup expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE rate_limits IS 'Tracks rate limits for user actions to prevent spam and abuse';
COMMENT ON COLUMN rate_limits.action_type IS 'Type of action: post, comment, message, etc.';
COMMENT ON COLUMN rate_limits.window_start IS 'Start of the time window for this rate limit';
COMMENT ON COLUMN rate_limits.expires_at IS 'When this rate limit window expires';

-- Test the table creation
SELECT 'Rate limiting table created successfully!' as status;
