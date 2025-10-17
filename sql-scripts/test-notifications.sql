-- Test Notifications
-- Run this in your Supabase SQL Editor

-- 1. Check if notifications table exists and has data
SELECT 'Notifications table check:' as test;
SELECT COUNT(*) as total_notifications FROM notifications;

-- 2. Check if there are any unread notifications
SELECT 'Unread notifications check:' as test;
SELECT COUNT(*) as unread_notifications 
FROM notifications 
WHERE is_read = FALSE;

-- 3. Test the function directly
SELECT 'Function test:' as test;
SELECT get_unread_notification_count() as function_result;

-- 4. Create a test notification for the current user
SELECT 'Creating test notification:' as test;
INSERT INTO notifications (user_id, type, title, message, data)
VALUES (
  auth.uid(),
  'system',
  'Test Notification',
  'This is a test notification to verify the system works!',
  '{"test": true}'::jsonb
);

-- 5. Check the count again
SELECT 'Count after test notification:' as test;
SELECT get_unread_notification_count() as function_result_after;

-- 6. Check notifications for current user
SELECT 'User notifications:' as test;
SELECT id, type, title, message, is_read, created_at 
FROM notifications 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Test message
SELECT 'Test completed! Check the results above.' as status;


