-- Notifications Schema
-- Run this in your Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'comment_reply', 'post_like', 'comment_like', 'event_invite', 
    'event_reminder', 'mention', 'direct_message', 'community_join',
    'event_rsvp', 'post_comment', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Additional data like post_id, comment_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- For temporary notifications
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  notification_data JSONB DEFAULT '{}'::jsonb,
  expires_in_hours INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration time if provided
  IF expires_in_hours IS NOT NULL THEN
    expires_at := NOW() + (expires_in_hours || ' hours')::INTERVAL;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id, type, title, message, data, expires_at
  ) VALUES (
    target_user_id, notification_type, notification_title, 
    notification_message, notification_data, expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM notifications
  WHERE user_id = auth.uid() 
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to automatically create notifications

-- Function to create comment reply notification
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_comment_user_id UUID;
  post_author_id UUID;
  commenter_name TEXT;
  post_title TEXT;
BEGIN
  -- Get parent comment author
  SELECT user_id INTO parent_comment_user_id
  FROM comments
  WHERE id = NEW.parent_comment_id;
  
  -- Get commenter name
  SELECT full_name INTO commenter_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Get post title and author
  SELECT p.title, p.user_id INTO post_title, post_author_id
  FROM posts p
  WHERE p.id = NEW.post_id;
  
  -- Don't notify if replying to own comment
  IF parent_comment_user_id != NEW.user_id THEN
    PERFORM create_notification(
      parent_comment_user_id,
      'comment_reply',
      'New Reply to Your Comment',
      COALESCE(commenter_name, 'Someone') || ' replied to your comment on "' || COALESCE(post_title, 'a post') || '"',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'parent_comment_id', NEW.parent_comment_id,
        'commenter_id', NEW.user_id
      )
    );
  END IF;
  
  -- Notify post author if different from commenter and parent comment author
  IF post_author_id != NEW.user_id AND post_author_id != parent_comment_user_id THEN
    PERFORM create_notification(
      post_author_id,
      'post_comment',
      'New Comment on Your Post',
      COALESCE(commenter_name, 'Someone') || ' commented on your post "' || COALESCE(post_title, 'Untitled') || '"',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'commenter_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment reply notifications
DROP TRIGGER IF EXISTS notify_comment_reply_trigger ON comments;
CREATE TRIGGER notify_comment_reply_trigger
  AFTER INSERT ON comments
  FOR EACH ROW 
  WHEN (NEW.parent_comment_id IS NOT NULL)
  EXECUTE FUNCTION notify_comment_reply();

-- Function to create like notification
CREATE OR REPLACE FUNCTION notify_like()
RETURNS TRIGGER AS $$
DECLARE
  liked_user_id UUID;
  liker_name TEXT;
  post_title TEXT;
  comment_content TEXT;
BEGIN
  -- Get liker name
  SELECT full_name INTO liker_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Handle post likes
  IF NEW.post_id IS NOT NULL THEN
    SELECT p.user_id, p.title INTO liked_user_id, post_title
    FROM posts p
    WHERE p.id = NEW.post_id;
    
    -- Don't notify if liking own post
    IF liked_user_id != NEW.user_id THEN
      PERFORM create_notification(
        liked_user_id,
        'post_like',
        'Someone Liked Your Post',
        COALESCE(liker_name, 'Someone') || ' liked your post "' || COALESCE(post_title, 'Untitled') || '"',
        jsonb_build_object(
          'post_id', NEW.post_id,
          'liker_id', NEW.user_id
        )
      );
    END IF;
  END IF;
  
  -- Handle comment likes
  IF NEW.comment_id IS NOT NULL THEN
    SELECT c.user_id, c.content INTO liked_user_id, comment_content
    FROM comments c
    WHERE c.id = NEW.comment_id;
    
    -- Don't notify if liking own comment
    IF liked_user_id != NEW.user_id THEN
      PERFORM create_notification(
        liked_user_id,
        'comment_like',
        'Someone Liked Your Comment',
        COALESCE(liker_name, 'Someone') || ' liked your comment',
        jsonb_build_object(
          'comment_id', NEW.comment_id,
          'post_id', (SELECT post_id FROM comments WHERE id = NEW.comment_id),
          'liker_id', NEW.user_id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like notifications
DROP TRIGGER IF EXISTS notify_like_trigger ON likes;
CREATE TRIGGER notify_like_trigger
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_like();

-- Function to create event RSVP notification
CREATE OR REPLACE FUNCTION notify_event_rsvp()
RETURNS TRIGGER AS $$
DECLARE
  event_creator_id UUID;
  event_title TEXT;
  rsvper_name TEXT;
BEGIN
  -- Get event details
  SELECT e.created_by, e.title INTO event_creator_id, event_title
  FROM events e
  WHERE e.id = NEW.event_id;
  
  -- Get RSVPer name
  SELECT full_name INTO rsvper_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Don't notify if RSVPing own event
  IF event_creator_id != NEW.user_id THEN
    PERFORM create_notification(
      event_creator_id,
      'event_rsvp',
      'New Event RSVP',
      COALESCE(rsvper_name, 'Someone') || ' RSVPed "' || NEW.status || '" to your event "' || COALESCE(event_title, 'Untitled') || '"',
      jsonb_build_object(
        'event_id', NEW.event_id,
        'rsvp_id', NEW.id,
        'rsvper_id', NEW.user_id,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event RSVP notifications
DROP TRIGGER IF EXISTS notify_event_rsvp_trigger ON event_rsvps;
CREATE TRIGGER notify_event_rsvp_trigger
  AFTER INSERT ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION notify_event_rsvp();

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications TO service_role;
