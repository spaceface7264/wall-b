-- Debug Notifications
-- Run this in your Supabase SQL Editor

-- 1. Check if notifications table exists and has data
SELECT 'Notifications table check:' as info;
SELECT COUNT(*) as total_notifications FROM notifications;

-- 2. Check current user
SELECT 'Current user:' as info, auth.uid() as user_id;

-- 3. Check notifications for current user
SELECT 'User notifications:' as info;
SELECT id, type, title, message, is_read, created_at 
FROM notifications 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC;

-- 4. Check unread count
SELECT 'Unread count:' as info;
SELECT COUNT(*) as unread_count
FROM notifications 
WHERE user_id = auth.uid() 
AND is_read = FALSE;

-- 5. Check if we can insert a notification
SELECT 'Testing insert...' as info;
INSERT INTO notifications (user_id, type, title, message, data)
VALUES (
  auth.uid(),
  'system',
  'Debug Test',
  'This is a debug test notification',
  '{"debug": true}'::jsonb
) RETURNING id, title, created_at;

-- 6. Final count
SELECT 'Final unread count:' as info;
SELECT COUNT(*) as unread_count
FROM notifications 
WHERE user_id = auth.uid() 
AND is_read = FALSE;


