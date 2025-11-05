-- NSFW Detection Schema
-- Run this in your Supabase SQL Editor
-- Note: NSFW content is not allowed on this platform. This schema is for detection/monitoring only.

-- Add NSFW detection columns to posts table (for monitoring only - NSFW content is blocked)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS nsfw_confidence FLOAT CHECK (nsfw_confidence >= 0 AND nsfw_confidence <= 1);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS nsfw_detected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS nsfw_scan_method TEXT; -- 'manual', 'auto-text', 'auto-image', 'api'

-- Add NSFW detection columns to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS nsfw_confidence FLOAT CHECK (nsfw_confidence >= 0 AND nsfw_confidence <= 1);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS nsfw_detected_at TIMESTAMP WITH TIME ZONE;

-- Add NSFW column to communities table (if not exists from age verification script)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT FALSE;

-- Create nsfw_scan_log table for tracking NSFW scans
CREATE TABLE IF NOT EXISTS nsfw_scan_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'image', 'video')),
  scan_result TEXT NOT NULL CHECK (scan_result IN ('safe', 'nsfw', 'uncertain')),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  scan_method TEXT NOT NULL, -- 'manual', 'auto-text', 'auto-image', 'api-cloudinary', 'api-aws', etc.
  scan_details JSONB, -- Additional scan metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS posts_is_nsfw_idx ON posts(is_nsfw) WHERE is_nsfw = TRUE;
CREATE INDEX IF NOT EXISTS posts_nsfw_confidence_idx ON posts(nsfw_confidence) WHERE nsfw_confidence IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_is_nsfw_idx ON comments(is_nsfw) WHERE is_nsfw = TRUE;

CREATE INDEX IF NOT EXISTS nsfw_scan_log_content_idx ON nsfw_scan_log(content_id, content_type);
CREATE INDEX IF NOT EXISTS nsfw_scan_log_result_idx ON nsfw_scan_log(scan_result);
CREATE INDEX IF NOT EXISTS nsfw_scan_log_created_at_idx ON nsfw_scan_log(created_at DESC);
CREATE INDEX IF NOT EXISTS nsfw_scan_log_method_idx ON nsfw_scan_log(scan_method);

-- Enable Row Level Security for nsfw_scan_log
ALTER TABLE nsfw_scan_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nsfw_scan_log (admins can view all, users can view their own)
DROP POLICY IF EXISTS "Admins can view all scan logs" ON nsfw_scan_log;
CREATE POLICY "Admins can view all scan logs" ON nsfw_scan_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "System can log NSFW scans" ON nsfw_scan_log;
CREATE POLICY "System can log NSFW scans" ON nsfw_scan_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to update NSFW status on posts
CREATE OR REPLACE FUNCTION update_post_nsfw_status(
  post_uuid UUID,
  is_nsfw_flag BOOLEAN,
  confidence_value FLOAT DEFAULT NULL,
  method TEXT DEFAULT 'manual'
)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET 
    is_nsfw = is_nsfw_flag,
    nsfw_confidence = COALESCE(confidence_value, CASE WHEN is_nsfw_flag THEN 0.8 ELSE 0.0 END),
    nsfw_detected_at = CASE WHEN is_nsfw_flag THEN NOW() ELSE NULL END,
    nsfw_scan_method = method
  WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update NSFW status on comments
CREATE OR REPLACE FUNCTION update_comment_nsfw_status(
  comment_uuid UUID,
  is_nsfw_flag BOOLEAN,
  confidence_value FLOAT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE comments
  SET 
    is_nsfw = is_nsfw_flag,
    nsfw_confidence = COALESCE(confidence_value, CASE WHEN is_nsfw_flag THEN 0.8 ELSE 0.0 END),
    nsfw_detected_at = CASE WHEN is_nsfw_flag THEN NOW() ELSE NULL END
  WHERE id = comment_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN posts.is_nsfw IS 'Whether this post contains NSFW content. Requires age verification to view.';
COMMENT ON COLUMN posts.nsfw_confidence IS 'Confidence score (0-1) of NSFW detection. Higher = more certain.';
COMMENT ON COLUMN posts.nsfw_scan_method IS 'Method used to detect NSFW: manual (user marked), auto-text (keyword scan), auto-image (image analysis), api (third-party)';
COMMENT ON COLUMN comments.is_nsfw IS 'Whether this comment contains NSFW content.';
COMMENT ON TABLE nsfw_scan_log IS 'Logs all NSFW scans performed on content for moderation and audit purposes.';

-- Test the schema updates
SELECT 'NSFW detection schema created successfully!' as status;
