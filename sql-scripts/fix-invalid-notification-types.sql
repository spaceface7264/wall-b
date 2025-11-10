-- Fix existing invalid notification types before adding constraint
-- Run this FIRST if you're getting constraint violation errors
-- This will find and optionally fix any invalid notification types

-- Step 1: Find all invalid notification types
SELECT 
  type,
  COUNT(*) as count
FROM notifications
WHERE type NOT IN (
  'comment_reply', 'post_like', 'comment_like', 'event_invite', 
  'event_reminder', 'mention', 'direct_message', 'community_join',
  'community_invite', 'event_rsvp', 'post_comment', 'system',
  'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'
)
GROUP BY type;

-- Step 2: If you found invalid types, you have options:

-- Option A: Update invalid types to 'system' (safest)
-- Uncomment and modify as needed:
-- UPDATE notifications 
-- SET type = 'system' 
-- WHERE type NOT IN (
--   'comment_reply', 'post_like', 'comment_like', 'event_invite', 
--   'event_reminder', 'mention', 'direct_message', 'community_join',
--   'community_invite', 'event_rsvp', 'post_comment', 'system',
--   'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'
-- );

-- Option B: Delete invalid notifications (use with caution!)
-- Uncomment only if you're sure:
-- DELETE FROM notifications 
-- WHERE type NOT IN (
--   'comment_reply', 'post_like', 'comment_like', 'event_invite', 
--   'event_reminder', 'mention', 'direct_message', 'community_join',
--   'community_invite', 'event_rsvp', 'post_comment', 'system',
--   'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'
-- );

-- After running one of the options above, then run:
-- sql-scripts/add-community-invite-notification-type.sql

