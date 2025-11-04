-- Test Community Update Permission
-- Run this in your Supabase SQL Editor to verify your admin status and permissions

-- 1. Check if you're authenticated
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED - Please log in first'
    ELSE 'You are authenticated'
  END as auth_status;

-- 2. Check your admin status
SELECT 
  id,
  full_name,
  email,
  is_admin,
  CASE 
    WHEN is_admin = TRUE THEN '✅ You ARE an admin'
    ELSE '❌ You are NOT an admin - Contact database administrator'
  END as admin_status
FROM profiles
WHERE id = auth.uid();

-- 3. Check if communities table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'communities';

-- 4. List all RLS policies on communities table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'communities'
ORDER BY policyname;

-- 5. Test if you can SELECT communities (should work for authenticated users)
SELECT 
  COUNT(*) as communities_visible,
  'If this returns a number, you can read communities' as status
FROM communities;

-- 6. Test if you can UPDATE communities (this is what we need for suspend/unsuspend)
-- This will show you which communities you can update (if any)
SELECT 
  id,
  name,
  is_active,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    ) THEN '✅ You SHOULD be able to update this community'
    ELSE '❌ You CANNOT update this community - Admin check failed'
  END as update_permission
FROM communities
LIMIT 5;

-- 7. Try a test update (this won't actually change anything, just test permission)
-- Uncomment the line below to test if you can actually perform an update
-- UPDATE communities SET updated_at = updated_at WHERE id IN (SELECT id FROM communities LIMIT 1) RETURNING id, name;

SELECT 'Diagnostic complete! Check the results above.' as status;


