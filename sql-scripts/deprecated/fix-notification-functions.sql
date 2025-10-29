-- Fix Notification Functions
-- Run this in your Supabase SQL Editor

-- 1. Check if the function exists and works
SELECT get_unread_notification_count() as test_count;

-- 2. Check if there are any notifications
SELECT COUNT(*) as total_notifications FROM notifications;

-- 3. Check if there are any unread notifications
SELECT COUNT(*) as unread_notifications 
FROM notifications 
WHERE is_read = FALSE;

-- 4. Recreate the function with better error handling
DROP FUNCTION IF EXISTS get_unread_notification_count();

CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*)
  INTO unread_count
  FROM notifications
  WHERE user_id = auth.uid() 
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant proper permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;

-- 6. Test the function again
SELECT get_unread_notification_count() as fixed_count;

-- 7. Test message
SELECT 'Notification functions fixed!' as status;


