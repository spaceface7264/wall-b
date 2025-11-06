-- Update notifications schema to support community_invite type
-- Run this in your Supabase SQL Editor

-- First, drop the existing constraint if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with community_invite included
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
    'system'
  ));

-- Note: If you get an error about the constraint already existing with different values,
-- you may need to manually drop it first:
-- ALTER TABLE notifications DROP CONSTRAINT notifications_type_check CASCADE;
-- Then run the ADD CONSTRAINT command above.

