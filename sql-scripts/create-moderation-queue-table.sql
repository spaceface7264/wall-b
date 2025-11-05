-- Moderation Queue Schema
-- Run this in your Supabase SQL Editor

-- Create moderation_queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'community')),
  reason TEXT NOT NULL, -- Why it was flagged
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  flagged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who reported/flagged it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create moderation_actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES moderation_queue(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('approved', 'deleted', 'edited', 'warned', 'dismissed', 'suspended_user', 'banned_user')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add requires_moderation column to posts and comments
ALTER TABLE posts ADD COLUMN IF NOT EXISTS requires_moderation BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS requires_moderation BOOLEAN DEFAULT FALSE;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS moderation_queue_content_idx ON moderation_queue(content_id, content_type);
CREATE INDEX IF NOT EXISTS moderation_queue_status_idx ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS moderation_queue_priority_idx ON moderation_queue(priority);
CREATE INDEX IF NOT EXISTS moderation_queue_assigned_to_idx ON moderation_queue(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS moderation_queue_created_at_idx ON moderation_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_queue_flagged_by_idx ON moderation_queue(flagged_by) WHERE flagged_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS moderation_actions_queue_id_idx ON moderation_actions(queue_id);
CREATE INDEX IF NOT EXISTS moderation_actions_moderator_id_idx ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS moderation_actions_created_at_idx ON moderation_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS posts_requires_moderation_idx ON posts(requires_moderation) WHERE requires_moderation = TRUE;
CREATE INDEX IF NOT EXISTS comments_requires_moderation_idx ON comments(requires_moderation) WHERE requires_moderation = TRUE;

-- Enable Row Level Security
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_queue - Admins and moderators can view
DROP POLICY IF EXISTS "Admins and moderators can view moderation queue" ON moderation_queue;
CREATE POLICY "Admins and moderators can view moderation queue" ON moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR EXISTS (
        SELECT 1 FROM community_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
      ))
    )
  );

DROP POLICY IF EXISTS "Admins and moderators can manage moderation queue" ON moderation_queue;
CREATE POLICY "Admins and moderators can manage moderation queue" ON moderation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR EXISTS (
        SELECT 1 FROM community_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
      ))
    )
  );

-- RLS Policies for moderation_actions - Admins and moderators can view
DROP POLICY IF EXISTS "Admins and moderators can view moderation actions" ON moderation_actions;
CREATE POLICY "Admins and moderators can view moderation actions" ON moderation_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR EXISTS (
        SELECT 1 FROM community_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
      ))
    )
  );

DROP POLICY IF EXISTS "Admins and moderators can create moderation actions" ON moderation_actions;
CREATE POLICY "Admins and moderators can create moderation actions" ON moderation_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR EXISTS (
        SELECT 1 FROM community_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
      ))
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_moderation_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_moderation_queue_updated_at_trigger ON moderation_queue;
CREATE TRIGGER update_moderation_queue_updated_at_trigger
  BEFORE UPDATE ON moderation_queue
  FOR EACH ROW EXECUTE FUNCTION update_moderation_queue_updated_at();

-- Add comments for documentation
COMMENT ON TABLE moderation_queue IS 'Queue of content that needs moderation review';
COMMENT ON TABLE moderation_actions IS 'History of actions taken by moderators on queued content';
COMMENT ON COLUMN moderation_queue.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN moderation_queue.status IS 'Current status: pending, in_review, resolved, dismissed';
COMMENT ON COLUMN posts.requires_moderation IS 'Whether this post requires moderation review';
COMMENT ON COLUMN comments.requires_moderation IS 'Whether this comment requires moderation review';

-- Test the table creation
SELECT 'Moderation queue tables created successfully!' as status;
