-- Fix RLS Policy to Hide Suspended Communities from Authenticated Users
-- Run this in your Supabase SQL Editor
-- This ensures only admins can see suspended communities, regular authenticated users can only see active ones

-- Create or replace the is_admin_user() function if it doesn't exist
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

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Allow public to read active communities" ON communities;
DROP POLICY IF EXISTS "Allow authenticated users to read communities" ON communities;
DROP POLICY IF EXISTS "Allow authenticated users to read active communities" ON communities;
DROP POLICY IF EXISTS "Allow anonymous users to read active communities" ON communities;
DROP POLICY IF EXISTS "Allow admins to read all communities" ON communities;

-- Create policy for admins to read ALL communities (including suspended)
CREATE POLICY "Allow admins to read all communities" ON communities
  FOR SELECT 
  USING (public.is_admin_user());

-- Create policy for authenticated users to read ONLY active communities
-- This ensures regular logged-in users cannot see suspended communities
CREATE POLICY "Allow authenticated users to read active communities" ON communities
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' 
    AND NOT public.is_admin_user()  -- Exclude admins (they use the policy above)
    AND (is_active = TRUE OR is_active IS NULL)
  );

-- Create policy for anonymous users to read active communities (for invite previews)
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

-- Test query to verify regular authenticated users cannot see suspended communities
-- This should only return active communities for non-admin authenticated users
SELECT 
  'RLS Policy Test:' as test,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_count,
  COUNT(*) FILTER (WHERE is_active = FALSE) as suspended_count,
  COUNT(*) as total_count
FROM communities;

SELECT 'RLS policies updated! Authenticated users can now only see active communities.' as status;
SELECT 'Admins can still see all communities (including suspended) via the admin panel.' as admin_note;
SELECT 'Anonymous users can only see active communities (for invite previews).' as anon_note;

