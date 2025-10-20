-- Fix RLS policies to allow posts-profiles join queries
-- Run this in your Supabase SQL Editor

-- 1. Ensure all tables have RLS enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies for all tables
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "posts_select_policy" ON posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON posts;
DROP POLICY IF EXISTS "posts_update_policy" ON posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON posts;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
DROP POLICY IF EXISTS "comments_update_policy" ON comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON comments;

-- 3. Create simple, permissive policies for posts
CREATE POLICY "posts_select_policy" ON posts
  FOR SELECT USING (true);

CREATE POLICY "posts_insert_policy" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "posts_update_policy" ON posts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "posts_delete_policy" ON posts
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Create simple, permissive policies for profiles
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Create simple, permissive policies for comments
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "comments_update_policy" ON comments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('posts', 'profiles', 'comments')
ORDER BY tablename, policyname;

-- 7. Test the join queries work
SELECT 'Testing posts-profiles join...' as status;

-- This should work now
SELECT 
  p.id,
  p.title,
  p.user_name,
  pr.nickname,
  pr.full_name
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
LIMIT 5;

SELECT 'Testing comments-profiles join...' as status;

-- Test comments join
SELECT 
  c.id,
  c.content,
  c.user_name,
  pr.nickname,
  pr.full_name
FROM comments c
LEFT JOIN profiles pr ON c.user_id = pr.id
LIMIT 5;

SELECT 'All joins fixed successfully!' as result;
