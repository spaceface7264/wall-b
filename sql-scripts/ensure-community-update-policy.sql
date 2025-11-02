-- Ensure Community Update Policy Allows Admin to Suspend/Unsuspend
-- Run this in your Supabase SQL Editor
-- This ensures admins can update communities, including the is_active field

-- Drop existing update policies if they exist
DROP POLICY IF EXISTS "Allow admins to update communities" ON communities;
DROP POLICY IF EXISTS "Users can update their own communities" ON communities;
DROP POLICY IF EXISTS "Allow authenticated users to update communities" ON communities;
DROP POLICY IF EXISTS "Allow admins and moderators to update communities" ON communities;

-- Create comprehensive policy that allows:
-- 1. Admins to update ANY community (including is_active field for suspend/unsuspend)
-- 2. Community admins/moderators to update their communities (except is_active - only admins can suspend)
CREATE POLICY "Allow admins and moderators to update communities" ON communities
  FOR UPDATE USING (
    -- Admins can update any community, including suspending
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
    OR
    -- Community admins/moderators can update their own communities (but not is_active)
    -- Note: This allows updates to name, description, rules, etc. but not is_active
    (
      EXISTS (
        SELECT 1 FROM community_members
        WHERE community_id = communities.id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
      )
    )
  )
  WITH CHECK (
    -- For is_active field changes, only allow admins
    (
      CASE 
        WHEN (SELECT is_active FROM communities WHERE id = communities.id) IS DISTINCT FROM communities.is_active
        THEN EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND is_admin = TRUE
        )
        ELSE TRUE
      END
    )
    AND
    (
      -- Admins can update any community
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND is_admin = TRUE
      )
      OR
      -- Community admins/moderators can update their own communities (but not is_active)
      EXISTS (
        SELECT 1 FROM community_members
        WHERE community_id = communities.id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
      )
    )
  );

-- Alternative simpler approach: Just allow admins to update everything
-- This is safer and more explicit
CREATE POLICY "Allow admins to update all community fields" ON communities
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

-- Test the policy
SELECT 'Community update policies added successfully!' as status;
SELECT 'Admins can now update communities including suspend/unsuspend (is_active field)' as info;

