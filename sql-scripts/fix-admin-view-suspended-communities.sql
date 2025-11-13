-- Fix RLS Policy to Allow Admins to View Suspended Communities
-- Run this in your Supabase SQL Editor
-- This ensures admins can see all communities, including suspended ones (is_active = false)

-- Create or replace the is_admin_user() function
-- CREATE OR REPLACE will work whether the function exists or not
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
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT COALESCE(is_admin, FALSE) INTO admin_status
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(admin_status, FALSE) = TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- Drop existing SELECT policies that might be filtering out suspended communities
DROP POLICY IF EXISTS "Allow public to read active communities" ON communities;
DROP POLICY IF EXISTS "Allow authenticated users to read communities" ON communities;
DROP POLICY IF EXISTS "Allow admins to read all communities" ON communities;

-- Create a policy that allows admins to read ALL communities (including suspended)
-- This policy must come first and use is_admin_user() to bypass RLS filtering
CREATE POLICY "Allow admins to read all communities" ON communities
  FOR SELECT 
  USING (public.is_admin_user());

-- Create a policy for authenticated users to read active communities
-- This allows regular users to see active communities, but admins will see all via the policy above
CREATE POLICY "Allow authenticated users to read active communities" ON communities
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' 
    AND (is_active = TRUE OR is_active IS NULL)
  );

-- Create a policy for anonymous users to read active communities (for invite previews)
CREATE POLICY "Allow anonymous users to read active communities" ON communities
  FOR SELECT 
  USING (
    auth.role() = 'anon' 
    AND is_active = TRUE
  );

-- Verify the policies
SELECT 
  'Policy check:' as info,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'communities'
ORDER BY policyname;

-- Test query to verify admins can see suspended communities
-- This should return all communities including those with is_active = false
SELECT 
  'Admin communities check:' as test,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_count,
  COUNT(*) FILTER (WHERE is_active = FALSE) as suspended_count,
  COUNT(*) as total_count
FROM communities;

SELECT 'RLS policies updated! Admins should now be able to see all communities including suspended ones.' as status;
SELECT 'If you still cannot see suspended communities, verify:' as troubleshooting;
SELECT '1. Your profile has is_admin = TRUE: SELECT id, email, is_admin FROM profiles WHERE id = auth.uid();' as step1;
SELECT '2. The is_admin_user() function returns TRUE: SELECT public.is_admin_user();' as step2;
SELECT '3. Check browser console for the debug logs showing suspended community count' as step3;

