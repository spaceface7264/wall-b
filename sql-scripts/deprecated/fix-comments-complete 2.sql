-- Complete fix for comments table
-- Run this in your Supabase SQL Editor

-- 1. Add missing user_name column
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 2. Add comment to describe the column
COMMENT ON COLUMN comments.user_name IS 'Display name of the user who created the comment';

-- 3. Update existing comments to have default values
UPDATE comments 
SET user_name = 'Anonymous'
WHERE user_name IS NULL;

-- 4. Make the column NOT NULL with default
ALTER TABLE comments 
ALTER COLUMN user_name SET NOT NULL;

-- 5. Set default value for future inserts
ALTER TABLE comments 
ALTER COLUMN user_name SET DEFAULT 'Anonymous';

-- 6. Fix RLS policies for comments
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
DROP POLICY IF EXISTS "comments_update_policy" ON comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON comments;

-- Create new RLS policies
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "comments_update_policy" ON comments
  FOR UPDATE USING (true);

CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE USING (true);

-- 7. Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND column_name = 'user_name';

-- 8. Test comment creation
INSERT INTO comments (post_id, user_id, user_name, content, parent_comment_id, like_count, reply_count)
VALUES (
  (SELECT id FROM posts LIMIT 1),
  '00000000-0000-0000-0000-000000000000',
  'Test User',
  'Test comment to verify schema',
  NULL,
  0,
  0
);

-- 9. Show the test comment
SELECT id, content, user_name, created_at FROM comments WHERE content = 'Test comment to verify schema';

-- 10. Clean up test comment
DELETE FROM comments WHERE content = 'Test comment to verify schema';
