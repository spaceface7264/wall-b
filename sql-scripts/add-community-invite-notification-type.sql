wh  ));

-- If you get error 23514 (constraint violation), it means there are existing rows
-- with invalid types. Run this query to find them:
-- SELECT DISTINCT type FROM notifications WHERE type NOT IN (
--   'comment_reply', 'post_like', 'comment_like', 'event_invite', 
--   'event_reminder', 'mention', 'direct_message', 'community_join',
--   'community_invite', 'event_rsvp', 'post_comment', 'system',
--   'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'
-- );
--
-- Then run: sql-scripts/add-community-invite-notification-type-complete.sql
-- which will fix the existing data before adding the constraint.

