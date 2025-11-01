-- Content Reports Schema (Posts and Comments)
-- Run this in your Supabase SQL Editor

-- Create post_reports table
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT, -- e.g., 'post_deleted', 'warning_issued', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_reports table
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT, -- e.g., 'comment_deleted', 'warning_issued', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for post_reports
CREATE INDEX IF NOT EXISTS post_reports_post_id_idx ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS post_reports_reported_by_idx ON post_reports(reported_by);
CREATE INDEX IF NOT EXISTS post_reports_status_idx ON post_reports(status);
CREATE INDEX IF NOT EXISTS post_reports_created_at_idx ON post_reports(created_at DESC);

-- Create indexes for comment_reports
CREATE INDEX IF NOT EXISTS comment_reports_comment_id_idx ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS comment_reports_reported_by_idx ON comment_reports(reported_by);
CREATE INDEX IF NOT EXISTS comment_reports_status_idx ON comment_reports(status);
CREATE INDEX IF NOT EXISTS comment_reports_created_at_idx ON comment_reports(created_at DESC);

-- Prevent duplicate reports from same user for same post/comment
CREATE UNIQUE INDEX IF NOT EXISTS post_reports_unique_user_post 
ON post_reports(reported_by, post_id) 
WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS comment_reports_unique_user_comment 
ON comment_reports(reported_by, comment_id) 
WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_reports
DROP POLICY IF EXISTS "Users can create post reports" ON post_reports;
CREATE POLICY "Users can create post reports" ON post_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can view their own post reports or admins can view all" ON post_reports;
CREATE POLICY "Users can view their own post reports or admins can view all" ON post_reports
  FOR SELECT USING (
    auth.uid() = reported_by OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update post reports" ON post_reports;
CREATE POLICY "Admins can update post reports" ON post_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS Policies for comment_reports
DROP POLICY IF EXISTS "Users can create comment reports" ON comment_reports;
CREATE POLICY "Users can create comment reports" ON comment_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can view their own comment reports or admins can view all" ON comment_reports;
CREATE POLICY "Users can view their own comment reports or admins can view all" ON comment_reports
  FOR SELECT USING (
    auth.uid() = reported_by OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update comment reports" ON comment_reports;
CREATE POLICY "Admins can update comment reports" ON comment_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

