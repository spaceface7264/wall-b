-- Update RLS policies for private community content visibility
-- Run this in your Supabase SQL Editor

-- Allow public read access to community basic info (name, description)
-- This is already handled by existing policies, but we ensure it's explicit

-- Update posts RLS to restrict content for private communities
-- Users can only see posts in private communities if they are members
DROP POLICY IF EXISTS "Users can view posts in their communities" ON posts;
CREATE POLICY "Users can view posts in their communities" ON posts
  FOR SELECT 
  USING (
    -- Public communities: anyone can view
    (SELECT is_private FROM communities WHERE id = posts.community_id) = FALSE
    OR
    -- Private communities: only members can view
    (
      (SELECT is_private FROM communities WHERE id = posts.community_id) = TRUE
      AND EXISTS (
        SELECT 1 FROM community_members
        WHERE community_id = posts.community_id
        AND user_id = auth.uid()
      )
    )
    OR
    -- Users can always view their own posts
    user_id = auth.uid()
  );

-- Update events RLS to restrict content for private communities
DROP POLICY IF EXISTS "Users can view events in their communities" ON events;
CREATE POLICY "Users can view events in their communities" ON events
  FOR SELECT 
  USING (
    -- Public communities: anyone can view
    (SELECT is_private FROM communities WHERE id = events.community_id) = FALSE
    OR
    -- Private communities: only members can view
    (
      (SELECT is_private FROM communities WHERE id = events.community_id) = TRUE
      AND EXISTS (
        SELECT 1 FROM community_members
        WHERE community_id = events.community_id
        AND user_id = auth.uid()
      )
    )
    OR
    -- Users can always view their own events
    created_by = auth.uid()
  );

-- Update community_members RLS to restrict member list visibility for private communities
-- Note: This assumes there's already a policy for viewing members
-- We add a policy that allows viewing members in public communities or if user is a member
DROP POLICY IF EXISTS "Users can view members in accessible communities" ON community_members;
CREATE POLICY "Users can view members in accessible communities" ON community_members
  FOR SELECT 
  USING (
    -- Public communities: anyone can view members
    (SELECT is_private FROM communities WHERE id = community_members.community_id) = FALSE
    OR
    -- Private communities: only members can view other members
    (
      (SELECT is_private FROM communities WHERE id = community_members.community_id) = TRUE
      AND EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
      )
    )
  );

-- Ensure communities table allows public read of basic info (name, description)
-- This should already exist, but we ensure it's there
DROP POLICY IF EXISTS "Anyone can view community basic info" ON communities;
CREATE POLICY "Anyone can view community basic info" ON communities
  FOR SELECT 
  USING (true); -- Anyone can see community name and description

-- Test query
SELECT 'RLS policies updated successfully for private communities!' as status;

