-- Fix Community Suspend/Unsuspend Policy
-- Run this in your Supabase SQL Editor
-- This ensures admins can update the is_active field to suspend/unsuspend communities

-- Ensure the profiles table has the is_admin column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for better performance on admin queries
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin) WHERE is_admin = TRUE;

-- Drop ALL existing policies on communities to avoid conflicts
-- We'll recreate SELECT, UPDATE, and DELETE policies
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'communities'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON communities';
  END LOOP;
END $$;

-- Also explicitly drop known policy names
DROP POLICY IF EXISTS "Allow admins to update communities" ON communities;
DROP POLICY IF EXISTS "Users can update their own communities" ON communities;
DROP POLICY IF EXISTS "Allow authenticated users to update communities" ON communities;
DROP POLICY IF EXISTS "Allow admins and moderators to update communities" ON communities;
DROP POLICY IF EXISTS "Allow admins to update all community fields" ON communities;
DROP POLICY IF EXISTS "Allow admins to delete communities" ON communities;

-- Verify RLS is enabled
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Drop the function if it exists to recreate it properly
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Create a SECURITY DEFINER function to check if current user is admin
-- This bypasses RLS on the profiles table, making the policy check reliable
-- SECURITY DEFINER runs with the privileges of the function owner (postgres by default)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get admin status, defaulting to FALSE if NULL or not found
  SELECT COALESCE(is_admin, FALSE) INTO admin_status
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(admin_status, FALSE) = TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return FALSE (fail closed for security)
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_admin_user() IS 'Returns TRUE if the current authenticated user is an admin. Uses SECURITY DEFINER to bypass RLS on profiles table.';

-- First, ensure SELECT policy allows admins to read all communities
-- This is needed for the admin panel and for UPDATE operations to work
CREATE POLICY "Allow admins to read all communities" ON communities
  FOR SELECT 
  USING (
    public.is_admin_user() OR 
    auth.role() = 'authenticated'
  );

-- Create INSERT policy (allow authenticated users to create communities)
CREATE POLICY "Allow authenticated users to create communities" ON communities
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create a simple, clear policy: Only admins can update communities
-- This includes updating is_active field for suspend/unsuspend
-- Uses the SECURITY DEFINER function to reliably check admin status
CREATE POLICY "Allow admins to update communities" ON communities
  FOR UPDATE 
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Create DELETE policy for admins only
-- Uses the same SECURITY DEFINER function for consistency
CREATE POLICY "Allow admins to delete communities" ON communities
  FOR DELETE 
  USING (public.is_admin_user());

-- Diagnostic queries to help troubleshoot
-- Check if user is authenticated and is an admin
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'Not authenticated'
    WHEN public.is_admin_user() THEN 'You are an admin - update policy should work'
    ELSE 'You are not an admin - contact your database administrator'
  END as admin_status,
  public.is_admin_user() as is_admin_value;

-- Show current policies on communities table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'communities'
ORDER BY policyname;

-- Important: Verify your admin status!
-- Run this query to check if you're actually an admin:
-- SELECT id, email, is_admin FROM profiles WHERE id = auth.uid();
-- 
-- If is_admin is NULL or FALSE, set it to TRUE:
-- UPDATE profiles SET is_admin = TRUE WHERE id = auth.uid();

SELECT 'Community suspend/unsuspend policy created successfully!' as status;
SELECT 'Admins can now suspend and unsuspend communities by updating is_active field' as info;
SELECT 'Admins can now delete communities' as delete_info;
SELECT 'is_admin_user() function created to reliably check admin status' as function_info;

-- Test the function
SELECT 
  'Testing is_admin_user() function:' as test_label,
  public.is_admin_user() as function_result,
  CASE 
    WHEN public.is_admin_user() THEN '✅ Function returns TRUE - You are recognized as admin'
    ELSE '❌ Function returns FALSE - Check if is_admin = TRUE in your profile'
  END as function_status;

-- Check your actual admin status in profiles table
SELECT 
  'Your profile admin status:' as check_label,
  id,
  email,
  COALESCE(is_admin, FALSE) as is_admin,
  CASE 
    WHEN COALESCE(is_admin, FALSE) = TRUE THEN '✅ Your profile shows you ARE an admin'
    ELSE '❌ Your profile shows you are NOT an admin - Run: UPDATE profiles SET is_admin = TRUE WHERE id = auth.uid();'
  END as profile_status
FROM profiles 
WHERE id = auth.uid();

SELECT 'If you still get permission errors, check:' as troubleshooting;
SELECT '1. Run the diagnostic queries above to verify admin status' as step1;
SELECT '2. Ensure is_admin = TRUE in your profiles table' as step2;
SELECT '3. Check browser console for detailed error messages' as step3;

-- Note: Suspending a community sets is_active = false, which:
-- 1. Hides the community from public listings
-- 2. Shows a "Suspended" badge in the admin panel
-- 3. Prevents new posts/comments (depending on your app logic)
-- 4. Can be reversed by unsuspending (setting is_active = true)

