-- Migration: 001_create_feedback_table
-- Description: Creates the feedback table for user feedback and bug reports
-- Created: 2025-01-XX

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous feedback
  user_email TEXT, -- Denormalized for quick access
  user_name TEXT, -- Denormalized user name
  
  -- Feedback content
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT, -- URL where feedback was submitted from
  
  -- Status tracking
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Admin response
  admin_response TEXT,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback(status);
CREATE INDEX IF NOT EXISTS feedback_type_idx ON feedback(type);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_priority_idx ON feedback(priority);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own feedback (or anonymous feedback)
CREATE POLICY "Users can submit feedback" ON feedback
  FOR INSERT
  WITH CHECK (true); -- Allow anyone to submit feedback (even anonymous)

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- Users can update their own feedback (but not status/priority/resolution - only admins)
-- Note: We can't use OLD/NEW in RLS policies, so restrictions on status/priority changes
-- should be enforced in application code or via triggers
CREATE POLICY "Users can update their own feedback" ON feedback
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- Admins can update all feedback (including status, priority, responses)
CREATE POLICY "Admins can manage all feedback" ON feedback
  FOR ALL
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- Create trigger function to prevent users from modifying admin-only fields
CREATE OR REPLACE FUNCTION prevent_user_feedback_modification()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT COALESCE(is_admin, false) INTO is_admin_user
  FROM profiles
  WHERE id = auth.uid();
  
  -- If not admin, prevent changes to admin-only fields
  IF NOT is_admin_user THEN
    -- Restore original values for admin-only fields
    NEW.status := OLD.status;
    NEW.priority := OLD.priority;
    NEW.admin_response := OLD.admin_response;
    NEW.resolved_at := OLD.resolved_at;
    NEW.admin_user_id := OLD.admin_user_id;
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce restrictions
CREATE TRIGGER feedback_prevent_modification
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_feedback_modification();

-- Add helpful comment
COMMENT ON TABLE feedback IS 'Stores user feedback, bug reports, and feature requests';
COMMENT ON COLUMN feedback.user_id IS 'Nullable to allow anonymous feedback submissions';
COMMENT ON COLUMN feedback.status IS 'open, in_progress, resolved, or closed';
COMMENT ON COLUMN feedback.priority IS 'low, medium, high, or urgent';
COMMENT ON COLUMN feedback.type IS 'bug, feature, improvement, or other';

