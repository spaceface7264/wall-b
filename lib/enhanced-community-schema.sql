-- Enhanced Community Database Schema
-- Run this in your Supabase SQL Editor

-- Create communities table (one per gym)
CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  rules TEXT, -- Community guidelines
  UNIQUE(gym_id) -- One community per gym
);

-- Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  UNIQUE(community_id, user_id) -- One membership per user per community
);

-- Create post_tags table for flexible tagging
CREATE TABLE IF NOT EXISTS post_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_media table for multiple images/videos per post
CREATE TABLE IF NOT EXISTS post_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table for achievements
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT DEFAULT '🏆',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Create events table for gym events and meetups
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT DEFAULT 'meetup' CHECK (event_type IN ('meetup', 'competition', 'training', 'social')),
  location TEXT, -- Specific location within gym or external
  max_participants INTEGER,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'weekly', 'monthly', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_rsvps table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'interested' CHECK (status IN ('going', 'interested', 'cant_go')),
  rsvp_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('👍', '❤️', '🔥', '💪', '🎉', '😮', '😢', '😡')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id, reaction_type), -- One reaction per type per user per post
  UNIQUE(user_id, comment_id, reaction_type), -- One reaction per type per user per comment
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Update posts table with new fields
ALTER TABLE posts ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'general';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'post' CHECK (post_type IN ('post', 'beta', 'event', 'question', 'gear', 'training', 'social'));

-- Update comments table to use parent_comment_id consistently
ALTER TABLE comments RENAME COLUMN parent_id TO parent_comment_id;

-- Add reply_count column if it doesn't exist
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS communities_gym_id_idx ON communities(gym_id);
CREATE INDEX IF NOT EXISTS community_members_community_id_idx ON community_members(community_id);
CREATE INDEX IF NOT EXISTS community_members_user_id_idx ON community_members(user_id);
CREATE INDEX IF NOT EXISTS posts_community_id_idx ON posts(community_id);
CREATE INDEX IF NOT EXISTS posts_tag_idx ON posts(tag);
CREATE INDEX IF NOT EXISTS posts_post_type_idx ON posts(post_type);
CREATE INDEX IF NOT EXISTS post_media_post_id_idx ON post_media(post_id);
CREATE INDEX IF NOT EXISTS events_community_id_idx ON events(community_id);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date);
CREATE INDEX IF NOT EXISTS event_rsvps_event_id_idx ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS reactions_post_id_idx ON reactions(post_id);
CREATE INDEX IF NOT EXISTS reactions_comment_id_idx ON reactions(comment_id);
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges(user_id);

-- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Allow authenticated users to read communities" ON communities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create communities" ON communities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Community members policies
CREATE POLICY "Allow authenticated users to read community members" ON community_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to join communities" ON community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to leave communities" ON community_members
  FOR DELETE USING (auth.uid() = user_id);

-- Post tags policies
CREATE POLICY "Allow authenticated users to read post tags" ON post_tags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Post media policies
CREATE POLICY "Allow authenticated users to read post media" ON post_media
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to create post media" ON post_media
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User badges policies
CREATE POLICY "Allow authenticated users to read user badges" ON user_badges
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to read their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Allow authenticated users to read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow community members to create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = events.community_id 
      AND user_id = auth.uid()
    )
  );

-- Event RSVPs policies
CREATE POLICY "Allow authenticated users to read event rsvps" ON event_rsvps
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to manage their own rsvps" ON event_rsvps
  FOR ALL USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Allow authenticated users to read reactions" ON reactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to create reactions" ON reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own reactions" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Update existing posts policies to include community_id
DROP POLICY IF EXISTS "Allow authenticated users to read posts" ON posts;
CREATE POLICY "Allow authenticated users to read posts" ON posts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Functions to update member counts
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for member count updates
CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Function to update comment reply counts
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count - 1 WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply count updates
CREATE TRIGGER update_comment_reply_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- Insert default post tags
INSERT INTO post_tags (name, color, description) VALUES
  ('beta', '#ef4444', 'Route beta and climbing tips'),
  ('event', '#3b82f6', 'Events, meetups, and competitions'),
  ('question', '#10b981', 'Questions and help requests'),
  ('gear', '#f59e0b', 'Gear reviews and recommendations'),
  ('training', '#8b5cf6', 'Training tips and workouts'),
  ('social', '#ec4899', 'Social posts and general chat'),
  ('news', '#6b7280', 'News and announcements')
ON CONFLICT (name) DO NOTHING;

-- Insert default user badges
INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_icon) 
SELECT 
  id,
  'first_post',
  'First Post',
  'Made your first community post',
  '📝'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_badges WHERE badge_type = 'first_post')
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- Grant permissions
GRANT ALL ON communities TO authenticated;
GRANT ALL ON community_members TO authenticated;
GRANT ALL ON post_tags TO authenticated;
GRANT ALL ON post_media TO authenticated;
GRANT ALL ON user_badges TO authenticated;
GRANT ALL ON events TO authenticated;
GRANT ALL ON event_rsvps TO authenticated;
GRANT ALL ON reactions TO authenticated;

