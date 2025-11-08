-- ============================================
-- Community Join Requests - Complete Setup
-- ============================================
-- This script creates the community_join_requests table
-- and sets up all necessary RLS policies, indexes, and triggers
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Create community_join_requests table
CREATE TABLE IF NOT EXISTS community_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT, -- Optional message from requester
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin/moderator who responded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- Note: We use a partial unique index instead of a table constraint
  -- to allow users to create new requests after rejection
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS community_join_requests_community_id_idx ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS community_join_requests_user_id_idx ON community_join_requests(user_id);
CREATE INDEX IF NOT EXISTS community_join_requests_status_idx ON community_join_requests(status);
CREATE INDEX IF NOT EXISTS community_join_requests_pending_idx ON community_join_requests(community_id, status) WHERE status = 'pending';

-- Step 3: Partial unique index: Only one pending request per user per community
-- This allows users to create new requests after rejection
CREATE UNIQUE INDEX IF NOT EXISTS community_join_requests_unique_pending 
  ON community_join_requests(community_id, user_id) 
  WHERE status = 'pending';

-- Step 4: Enable Row Level Security
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies
-- Users can create their own join requests
DROP POLICY IF EXISTS "Users can create join requests" ON community_join_requests;
CREATE POLICY "Users can create join requests" ON community_join_requests
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own join requests
DROP POLICY IF EXISTS "Users can view own join requests" ON community_join_requests;
CREATE POLICY "Users can view own join requests" ON community_join_requests
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins and moderators can view all requests for their communities
DROP POLICY IF EXISTS "Admins and moderators can view community join requests" ON community_join_requests;
CREATE POLICY "Admins and moderators can view community join requests" ON community_join_requests
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_join_requests.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- Admins and moderators can update requests (approve/reject)
DROP POLICY IF EXISTS "Admins and moderators can update join requests" ON community_join_requests;
CREATE POLICY "Admins and moderators can update join requests" ON community_join_requests
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_join_requests.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_join_requests.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- Step 6: Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_join_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Trigger to update updated_at
DROP TRIGGER IF EXISTS update_community_join_request_updated_at_trigger ON community_join_requests;
CREATE TRIGGER update_community_join_request_updated_at_trigger
  BEFORE UPDATE ON community_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_community_join_request_updated_at();

-- Step 8: Grant permissions
GRANT ALL ON community_join_requests TO authenticated;

-- Step 9: Update notifications table to support join request notification types
-- First, drop the existing constraint if it exists
DO $$ 
BEGIN
  -- Drop the existing CHECK constraint on notifications.type
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
EXCEPTION
  WHEN undefined_object THEN
    -- Constraint doesn't exist, that's fine
    NULL;
END $$;

-- Add the new constraint with community_join_request types
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'comment_reply', 'post_like', 'comment_like', 'event_invite', 
    'event_reminder', 'mention', 'direct_message', 'community_join',
    'event_rsvp', 'post_comment', 'system', 'community_invite',
    'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'
  ));

-- Step 10: Function to notify admins/moderators when a join request is created
CREATE OR REPLACE FUNCTION notify_community_join_request()
RETURNS TRIGGER AS $$
DECLARE
  community_name TEXT;
  requester_name TEXT;
  admin_mod_ids UUID[];
BEGIN
  -- Only notify on new pending requests
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get community name
  SELECT name INTO community_name
  FROM communities
  WHERE id = NEW.community_id;

  -- Get requester name
  SELECT COALESCE(nickname, full_name, 'Someone') INTO requester_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get all admin and moderator IDs for this community
  SELECT ARRAY_AGG(user_id) INTO admin_mod_ids
  FROM community_members
  WHERE community_id = NEW.community_id
  AND role IN ('admin', 'moderator');

  -- Create notifications for all admins and moderators
  IF admin_mod_ids IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      admin_mod_id,
      'community_join_request',
      'New Join Request',
      requester_name || ' requested to join "' || COALESCE(community_name, 'the community') || '"',
      jsonb_build_object(
        'community_id', NEW.community_id,
        'community_name', community_name,
        'request_id', NEW.id,
        'requester_id', NEW.user_id,
        'requester_name', requester_name
      )
    FROM unnest(admin_mod_ids) AS admin_mod_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Trigger for join request notifications
DROP TRIGGER IF EXISTS notify_community_join_request_trigger ON community_join_requests;
CREATE TRIGGER notify_community_join_request_trigger
  AFTER INSERT ON community_join_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_community_join_request();

-- Step 12: Function to notify requester when request is approved
CREATE OR REPLACE FUNCTION notify_join_request_approved()
RETURNS TRIGGER AS $$
DECLARE
  community_name TEXT;
  responder_name TEXT;
BEGIN
  -- Only notify on approval
  IF NEW.status != 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  -- Get community name
  SELECT name INTO community_name
  FROM communities
  WHERE id = NEW.community_id;

  -- Get responder name
  SELECT COALESCE(nickname, full_name, 'Admin') INTO responder_name
  FROM profiles
  WHERE id = NEW.responded_by;

  -- Notify the requester
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'community_join_request_approved',
    'Join Request Approved',
    'Your request to join "' || COALESCE(community_name, 'the community') || '" has been approved',
    jsonb_build_object(
      'community_id', NEW.community_id,
      'community_name', community_name,
      'request_id', NEW.id,
      'responded_by', NEW.responded_by,
      'responder_name', responder_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Trigger for approval notifications
DROP TRIGGER IF EXISTS notify_join_request_approved_trigger ON community_join_requests;
CREATE TRIGGER notify_join_request_approved_trigger
  AFTER UPDATE ON community_join_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION notify_join_request_approved();

-- Step 14: Function to notify requester when request is rejected
CREATE OR REPLACE FUNCTION notify_join_request_rejected()
RETURNS TRIGGER AS $$
DECLARE
  community_name TEXT;
  responder_name TEXT;
BEGIN
  -- Only notify on rejection
  IF NEW.status != 'rejected' OR OLD.status = 'rejected' THEN
    RETURN NEW;
  END IF;

  -- Get community name
  SELECT name INTO community_name
  FROM communities
  WHERE id = NEW.community_id;

  -- Get responder name
  SELECT COALESCE(nickname, full_name, 'Admin') INTO responder_name
  FROM profiles
  WHERE id = NEW.responded_by;

  -- Notify the requester
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'community_join_request_rejected',
    'Join Request Rejected',
    'Your request to join "' || COALESCE(community_name, 'the community') || '" was not approved',
    jsonb_build_object(
      'community_id', NEW.community_id,
      'community_name', community_name,
      'request_id', NEW.id,
      'responded_by', NEW.responded_by,
      'responder_name', responder_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 15: Trigger for rejection notifications
DROP TRIGGER IF EXISTS notify_join_request_rejected_trigger ON community_join_requests;
CREATE TRIGGER notify_join_request_rejected_trigger
  AFTER UPDATE ON community_join_requests
  FOR EACH ROW
  WHEN (NEW.status = 'rejected' AND OLD.status != 'rejected')
  EXECUTE FUNCTION notify_join_request_rejected();

-- Success message
SELECT 'community_join_requests table and notifications setup completed successfully!' as status;

