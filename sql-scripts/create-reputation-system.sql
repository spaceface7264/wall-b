-- Reputation System Schema
-- Run this in your Supabase SQL Editor

-- Add reputation columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'new' CHECK (trust_level IN ('new', 'trusted', 'verified', 'suspended'));

-- Create reputation_history table
CREATE TABLE IF NOT EXISTS reputation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL, -- Positive or negative change
  reason TEXT NOT NULL, -- Why the reputation changed
  source_id UUID, -- ID of the content/action that caused the change
  source_type TEXT, -- Type: 'post', 'comment', 'report', 'moderation', etc.
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who/what caused the change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS profiles_reputation_score_idx ON profiles(reputation_score);
CREATE INDEX IF NOT EXISTS profiles_trust_level_idx ON profiles(trust_level);

CREATE INDEX IF NOT EXISTS reputation_history_user_id_idx ON reputation_history(user_id);
CREATE INDEX IF NOT EXISTS reputation_history_created_at_idx ON reputation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS reputation_history_source_idx ON reputation_history(source_id, source_type) WHERE source_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reputation_history
DROP POLICY IF EXISTS "Users can view their own reputation history" ON reputation_history;
CREATE POLICY "Users can view their own reputation history" ON reputation_history
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "System can log reputation changes" ON reputation_history;
CREATE POLICY "System can log reputation changes" ON reputation_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to update reputation score and trust level
CREATE OR REPLACE FUNCTION update_reputation(
  target_user_id UUID,
  change_amount INTEGER,
  reason_text TEXT,
  source_id_val UUID DEFAULT NULL,
  source_type_val TEXT DEFAULT NULL,
  created_by_val UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  new_score INTEGER;
  new_trust_level TEXT;
BEGIN
  -- Update reputation score
  UPDATE profiles
  SET reputation_score = GREATEST(0, LEAST(1000, reputation_score + change_amount))
  WHERE id = target_user_id
  RETURNING reputation_score INTO new_score;

  -- Determine trust level based on score
  IF new_score < 0 THEN
    new_trust_level := 'suspended';
  ELSIF new_score >= 200 THEN
    new_trust_level := 'verified';
  ELSIF new_score >= 50 THEN
    new_trust_level := 'trusted';
  ELSE
    new_trust_level := 'new';
  END IF;

  -- Update trust level if it changed
  UPDATE profiles
  SET trust_level = new_trust_level
  WHERE id = target_user_id AND trust_level != new_trust_level;

  -- Log the change
  INSERT INTO reputation_history (
    user_id,
    change_amount,
    reason,
    source_id,
    source_type,
    created_by
  ) VALUES (
    target_user_id,
    change_amount,
    reason_text,
    source_id_val,
    source_type_val,
    created_by_val
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get reputation history for a user
CREATE OR REPLACE FUNCTION get_reputation_history(target_user_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  change_amount INTEGER,
  reason TEXT,
  source_id UUID,
  source_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rh.id,
    rh.change_amount,
    rh.reason,
    rh.source_id,
    rh.source_type,
    rh.created_at
  FROM reputation_history rh
  WHERE rh.user_id = target_user_id
  ORDER BY rh.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN profiles.reputation_score IS 'User reputation score (0-1000). Higher = better reputation.';
COMMENT ON COLUMN profiles.trust_level IS 'Trust level based on reputation: new (0-49), trusted (50-199), verified (200+), suspended (<0)';
COMMENT ON TABLE reputation_history IS 'History of reputation score changes for audit and transparency';
COMMENT ON COLUMN reputation_history.change_amount IS 'Amount of reputation change (positive or negative)';
COMMENT ON COLUMN reputation_history.source_id IS 'ID of the content/action that caused this change';
COMMENT ON COLUMN reputation_history.source_type IS 'Type of source: post, comment, report, moderation, etc.';

-- Test the schema updates
SELECT 'Reputation system schema created successfully!' as status;
