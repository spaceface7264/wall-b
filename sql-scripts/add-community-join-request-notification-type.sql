-- Add community_join_request notification type
-- Run this in your Supabase SQL Editor

-- First, drop the existing constraint if it exists
DO $$ 
BEGIN
  -- Drop the existing CHECK constraint on notifications.type
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
END $$;

-- Add the new constraint with community_join_request type
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'comment_reply', 'post_like', 'comment_like', 'event_invite', 
    'event_reminder', 'mention', 'direct_message', 'community_join',
    'event_rsvp', 'post_comment', 'system', 'community_invite',
    'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'
  ));

-- Function to notify admins/moderators when a join request is created
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

-- Trigger for join request notifications
DROP TRIGGER IF EXISTS notify_community_join_request_trigger ON community_join_requests;
CREATE TRIGGER notify_community_join_request_trigger
  AFTER INSERT ON community_join_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_community_join_request();

-- Function to notify requester when request is approved
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

-- Trigger for approval notifications
DROP TRIGGER IF EXISTS notify_join_request_approved_trigger ON community_join_requests;
CREATE TRIGGER notify_join_request_approved_trigger
  AFTER UPDATE ON community_join_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION notify_join_request_approved();

-- Function to notify requester when request is rejected
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

-- Trigger for rejection notifications
DROP TRIGGER IF EXISTS notify_join_request_rejected_trigger ON community_join_requests;
CREATE TRIGGER notify_join_request_rejected_trigger
  AFTER UPDATE ON community_join_requests
  FOR EACH ROW
  WHEN (NEW.status = 'rejected' AND OLD.status != 'rejected')
  EXECUTE FUNCTION notify_join_request_rejected();

-- Test query
SELECT 'community_join_request notification types added successfully!' as status;

