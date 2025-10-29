-- Complete fix for posts table
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 2. Add comments for the new columns
COMMENT ON COLUMN posts.user_name IS 'Display name of the user who created the post';
COMMENT ON COLUMN posts.user_email IS 'Email of the user who created the post';

-- 3. Update existing posts to have default values
UPDATE posts 
SET 
  user_name = 'Anonymous',
  user_email = 'unknown@example.com'
WHERE user_name IS NULL OR user_email IS NULL;

-- 4. Make the columns NOT NULL with defaults
ALTER TABLE posts 
ALTER COLUMN user_name SET NOT NULL,
ALTER COLUMN user_email SET NOT NULL;

-- 5. Set default values for future inserts
ALTER TABLE posts 
ALTER COLUMN user_name SET DEFAULT 'Anonymous',
ALTER COLUMN user_email SET DEFAULT 'unknown@example.com';

-- 6. Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('user_name', 'user_email', 'media_files')
ORDER BY column_name;

-- 7. Test the table structure
SELECT 
  id, 
  community_id, 
  user_id, 
  user_name, 
  user_email, 
  title, 
  content, 
  tag, 
  post_type, 
  media_files, 
  like_count, 
  comment_count, 
  created_at 
FROM posts 
LIMIT 3;
