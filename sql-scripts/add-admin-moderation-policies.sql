-- Add Admin Moderation Policies
-- Run this in your Supabase SQL Editor

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;

-- 2. Create new policies that allow admins to moderate content

-- Posts policies
CREATE POLICY "Users can delete their own posts or admins can delete any post" ON posts
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can update their own posts or admins can update any post" ON posts
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- Comments policies
CREATE POLICY "Users can delete their own comments or admins can delete any comment" ON comments
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can update their own comments or admins can update any comment" ON comments
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- 3. Test the policies
SELECT 'Admin moderation policies added successfully!' as status;
SELECT 'Admins can now delete and update any posts/comments' as info;


