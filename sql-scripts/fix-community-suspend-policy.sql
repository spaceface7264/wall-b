-- Fix Community Suspend/Unsuspend Policy
-- Run this in your Supabase SQL Editor
-- This ensures admins can update the is_active field to suspend/unsuspend communities

-- Drop all existing update policies on communities
DROP POLICY IF EXISTS "Allow admins to update communities" ON communities;
DROP POLICY IF EXISTS "Users can update their own communities" ON communities;
DROP POLICY IF EXISTS "Allow authenticated users to update communities" ON communities;
DROP POLICY IF EXISTS "Allow admins and moderators to update communities" ON communities;
DROP POLICY IF EXISTS "Allow admins to update all community fields" ON communities;

-- Create a simple, clear policy: Only admins can update communities
-- This includes updating is_active field for suspend/unsuspend
CREATE POLICY "Allow admins to update communities" ON communities
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- Verify RLS is enabled
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Test query to verify the policy works
-- This should return success if you're an admin
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    ) THEN 'You are an admin - update policy should work'
    ELSE 'You are not an admin - contact your database administrator'
  END as policy_status;

SELECT 'Community suspend/unsuspend policy created successfully!' as status;
SELECT 'Admins can now suspend and unsuspend communities by updating is_active field' as info;

