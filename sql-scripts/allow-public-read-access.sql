-- Allow public read access for read-only browsing
-- Run this in your Supabase SQL Editor
-- This enables unauthenticated users to browse content while requiring login for actions

-- ============================================
-- POSTS - Allow public read access
-- ============================================
DROP POLICY IF EXISTS "Allow public to read posts" ON posts;
CREATE POLICY "Allow public to read posts" ON posts
  FOR SELECT 
  USING (
    -- Authenticated users can read all posts
    auth.role() = 'authenticated'
    OR
    -- Anonymous users can read posts from active communities
    (
      auth.role() = 'anon' 
      AND EXISTS (
        SELECT 1 FROM communities 
        WHERE id = posts.community_id 
        AND is_active = TRUE
      )
    )
  );

-- ============================================
-- EVENTS - Allow public read access
-- ============================================
DROP POLICY IF EXISTS "Allow public to read events" ON events;
CREATE POLICY "Allow public to read events" ON events
  FOR SELECT 
  USING (
    -- Authenticated users can read all events
    auth.role() = 'authenticated'
    OR
    -- Anonymous users can read events from active communities
    (
      auth.role() = 'anon' 
      AND EXISTS (
        SELECT 1 FROM communities 
        WHERE id = events.community_id 
        AND is_active = TRUE
      )
    )
  );

-- ============================================
-- PROFILES - Allow public read access (public profiles only)
-- ============================================
DROP POLICY IF EXISTS "Allow public to read public profiles" ON profiles;
CREATE POLICY "Allow public to read public profiles" ON profiles
  FOR SELECT 
  USING (
    -- Authenticated users can read all profiles
    auth.role() = 'authenticated'
    OR
    -- Anonymous users can read public profiles (not banned, has completed onboarding)
    (
      auth.role() = 'anon' 
      AND is_banned = FALSE
      AND nickname IS NOT NULL
      AND handle IS NOT NULL
    )
  );

-- ============================================
-- GYMS - Allow public read access
-- ============================================
DROP POLICY IF EXISTS "Allow public to read gyms" ON gyms;
CREATE POLICY "Allow public to read gyms" ON gyms
  FOR SELECT 
  USING (
    -- Authenticated users can read all gyms
    auth.role() = 'authenticated'
    OR
    -- Anonymous users can read all gyms (they're public by nature)
    auth.role() = 'anon'
  );

-- ============================================
-- COMMUNITY MEMBERS - Allow public read access (for member lists)
-- ============================================
DROP POLICY IF EXISTS "Allow public to read community members" ON community_members;
CREATE POLICY "Allow public to read community members" ON community_members
  FOR SELECT 
  USING (
    -- Authenticated users can read all memberships
    auth.role() = 'authenticated'
    OR
    -- Anonymous users can read memberships from active communities
    (
      auth.role() = 'anon' 
      AND EXISTS (
        SELECT 1 FROM communities 
        WHERE id = community_members.community_id 
        AND is_active = TRUE
      )
    )
  );

-- ============================================
-- COMMENTS - Allow public read access
-- ============================================
DROP POLICY IF EXISTS "Allow public to read comments" ON comments;
CREATE POLICY "Allow public to read comments" ON comments
  FOR SELECT 
  USING (
    -- Authenticated users can read all comments
    auth.role() = 'authenticated'
    OR
    -- Anonymous users can read comments on posts from active communities
    (
      auth.role() = 'anon' 
      AND EXISTS (
        SELECT 1 FROM posts 
        JOIN communities ON posts.community_id = communities.id
        WHERE posts.id = comments.post_id 
        AND communities.is_active = TRUE
      )
    )
  );

-- ============================================
-- REACTIONS - Allow public read access (for viewing likes/reactions)
-- ============================================
DROP POLICY IF EXISTS "Allow public to read reactions" ON reactions;
CREATE POLICY "Allow public to read reactions" ON reactions
  FOR SELECT 
  USING (
    -- Authenticated users can read all reactions
    auth.role() = 'authenticated'
    OR
    -- Anonymous users can read reactions on posts from active communities
    (
      auth.role() = 'anon' 
      AND EXISTS (
        SELECT 1 FROM posts 
        JOIN communities ON posts.community_id = communities.id
        WHERE posts.id = reactions.post_id 
        AND communities.is_active = TRUE
      )
    )
  );

-- ============================================
-- NOTES
-- ============================================
-- These policies allow anonymous users to:
-- ✅ View communities (already handled in allow-public-community-access.sql)
-- ✅ View posts in active communities
-- ✅ View events in active communities
-- ✅ View public profiles
-- ✅ View gyms
-- ✅ View community member lists
-- ✅ View comments
-- ✅ View reactions/likes
--
-- But they still require authentication for:
-- ❌ Creating posts/comments
-- ❌ Joining communities
-- ❌ Liking/reacting
-- ❌ Sending messages
-- ❌ Creating communities
-- ❌ Any write operations


