-- Create Test Notification
-- Run this in your Supabase SQL Editor

-- 1. Check current user
SELECT 'Current user:' as info, auth.uid() as user_id;

-- 2. Create a test notification
INSERT INTO notifications (user_id, type, title, message, data)
VALUES (
  auth.uid(),
  'system',
  'Test Notification',
  'This is a test notification to verify the system works!',
  '{"test": true}'::jsonb
);

-- 3. Check the notification was created
SELECT 'Created notification:' as info;
SELECT id, type, title, message, is_read, created_at 
FROM notifications 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Count unread notifications
SELECT 'Unread count:' as info;
SELECT COUNT(*) as unread_count
FROM notifications 
WHERE user_id = auth.uid() 
AND is_read = FALSE;

-- 5. Success message
SELECT 'Test notification created successfully!' as status;


