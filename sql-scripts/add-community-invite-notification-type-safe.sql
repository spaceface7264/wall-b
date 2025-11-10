-- Update notifications schema to support community_invite type
-- Run this in your Supabase SQL Editor
-- This version safely handles existing data

-- Step 1: First, check what notification types currently exist
-- (This is just for reference, you can run it separately)
-- SELECT DISTINCT type FROM notifications;

-- Step 2: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 3: Add the new constraint with community_invite included
-- This includes all known notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'comment_reply', 
    'post_like', 
    'comment_like', 
    'event_invite', 
    'event_reminder', 
    'mention', 
    'direct_message', 
    'community_join',
    'community_invite',
    'event_rsvp', 
    'post_comment', 
    'system',
    'community_join_request',
    'community_join_request_approved',
    'community_join_request_rejected'
  ));

-- If you still get an error, it means there are rows with types not in the list above.
-- Run this query to find them:
-- SELECT DISTINCT type FROM notifications WHERE type NOT IN (
--   'comment_reply', 'post_like', 'comment_like', 'event_invite', 
--   'event_reminder', 'mention', 'direct_message', 'community_join',
--   'community_invite', 'event_rsvp', 'post_comment', 'system',
--   'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'
-- );

-- If you find other types, either:
-- 1. Update those rows to a valid type, OR
-- 2. Add the missing type to the constraint list above

