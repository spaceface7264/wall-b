-- Check and Fix Admin Status
-- Run this in your Supabase SQL Editor

-- 1. Check current admin status
SELECT 
  id, 
  email, 
  full_name, 
  is_admin,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Make the first user (you) an admin
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = (
  SELECT id FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- 3. Verify the change
SELECT 
  id, 
  email, 
  full_name, 
  is_admin,
  created_at
FROM profiles 
WHERE is_admin = TRUE;

-- 4. Test message
SELECT 'Admin status updated! Refresh your browser and try again.' as message;


