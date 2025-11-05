-- Content Filtering Schema (Blocked Words and Filtering)
-- Run this in your Supabase SQL Editor

-- Create blocked_words table for profanity/blocked words list
CREATE TABLE IF NOT EXISTS blocked_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  severity TEXT DEFAULT 'block' CHECK (severity IN ('warning', 'block', 'auto-flag')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_filters table for advanced filtering rules
CREATE TABLE IF NOT EXISTS content_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('pattern', 'regex', 'keyword')),
  pattern TEXT NOT NULL,
  action TEXT DEFAULT 'flag' CHECK (action IN ('flag', 'block', 'warn')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create filtered_content_log table for tracking filtered content
CREATE TABLE IF NOT EXISTS filtered_content_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'community')),
  filter_applied TEXT NOT NULL, -- Which filter/word was matched
  action_taken TEXT NOT NULL CHECK (action_taken IN ('blocked', 'flagged', 'warned', 'allowed')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS blocked_words_word_idx ON blocked_words(word);
CREATE INDEX IF NOT EXISTS blocked_words_severity_idx ON blocked_words(severity);
CREATE INDEX IF NOT EXISTS blocked_words_created_at_idx ON blocked_words(created_at DESC);

CREATE INDEX IF NOT EXISTS content_filters_type_idx ON content_filters(filter_type);
CREATE INDEX IF NOT EXISTS content_filters_active_idx ON content_filters(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS filtered_content_log_content_idx ON filtered_content_log(content_id, content_type);
CREATE INDEX IF NOT EXISTS filtered_content_log_user_idx ON filtered_content_log(user_id);
CREATE INDEX IF NOT EXISTS filtered_content_log_created_at_idx ON filtered_content_log(created_at DESC);
CREATE INDEX IF NOT EXISTS filtered_content_log_action_idx ON filtered_content_log(action_taken);

-- Enable Row Level Security
ALTER TABLE blocked_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE filtered_content_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_words (admins can manage, users can view)
DROP POLICY IF EXISTS "Users can view blocked words" ON blocked_words;
CREATE POLICY "Users can view blocked words" ON blocked_words
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage blocked words" ON blocked_words;
CREATE POLICY "Admins can manage blocked words" ON blocked_words
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- RLS Policies for content_filters (admins can manage, users can view active filters)
DROP POLICY IF EXISTS "Users can view active filters" ON content_filters;
CREATE POLICY "Users can view active filters" ON content_filters
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage content filters" ON content_filters;
CREATE POLICY "Admins can manage content filters" ON content_filters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- RLS Policies for filtered_content_log (admins can view all, users can view their own)
DROP POLICY IF EXISTS "Users can view their own filtered content log" ON filtered_content_log;
CREATE POLICY "Users can view their own filtered content log" ON filtered_content_log
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "System can log filtered content" ON filtered_content_log;
CREATE POLICY "System can log filtered content" ON filtered_content_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blocked_words_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_content_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_blocked_words_updated_at_trigger ON blocked_words;
CREATE TRIGGER update_blocked_words_updated_at_trigger
  BEFORE UPDATE ON blocked_words
  FOR EACH ROW EXECUTE FUNCTION update_blocked_words_updated_at();

DROP TRIGGER IF EXISTS update_content_filters_updated_at_trigger ON content_filters;
CREATE TRIGGER update_content_filters_updated_at_trigger
  BEFORE UPDATE ON content_filters
  FOR EACH ROW EXECUTE FUNCTION update_content_filters_updated_at();

-- Insert default blocked words (common profanity - can be expanded)
-- Note: Admin can add more via admin panel
INSERT INTO blocked_words (word, severity) VALUES
  ('spam', 'auto-flag'),
  ('scam', 'block'),
  ('phishing', 'block')
ON CONFLICT (word) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE blocked_words IS 'List of words that trigger content filtering. Severity determines action taken.';
COMMENT ON TABLE content_filters IS 'Advanced filtering rules using patterns, regex, or keywords.';
COMMENT ON TABLE filtered_content_log IS 'Logs all content that was filtered, for moderation review.';
COMMENT ON COLUMN blocked_words.severity IS 'warning: show warning but allow, block: prevent posting, auto-flag: post but flag for review';

-- Test the table creation
SELECT 'Content filtering tables created successfully!' as status;
