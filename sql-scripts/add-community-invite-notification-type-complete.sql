-- Complete fix: Handle existing invalid notification types and add community_invite support
-- Run this in your Supabase SQL Editor
-- This script will safely fix existing data and add the constraint

-- Step 1: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check CASCADE;

-- Step 2: Find and fix any invalid notification types
-- Update any invalid types to 'system' (safest option - preserves the notifications)
UPDATE notifications 
SET type = 'system' 
WHERE type NOT IN (
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
);

-- Step 3: Add the new constraint with community_invite included
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

-- Step 4: Verify it worked
SELECT 
  'Constraint added successfully!' as status,
  COUNT(*) as total_notifications,
  COUNT(DISTINCT type) as unique_types
FROM notifications;

