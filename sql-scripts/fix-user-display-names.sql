-- Fix user display names to use nickname instead of full_name or email
-- Run this in your Supabase SQL Editor

-- 1. First, ensure the nickname field exists in profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 2. Update existing profiles to use full_name as nickname if nickname is empty
UPDATE profiles 
SET nickname = full_name 
WHERE nickname IS NULL OR nickname = '';

-- 3. Update comments to use proper user names from profiles
UPDATE comments 
SET user_name = COALESCE(
  (SELECT nickname FROM profiles WHERE profiles.id = comments.user_id),
  (SELECT full_name FROM profiles WHERE profiles.id = comments.user_id),
  'Anonymous'
)
WHERE user_name = 'Anonymous' OR user_name IS NULL;

-- 4. Update posts to use proper user names from profiles  
UPDATE posts 
SET user_name = COALESCE(
  (SELECT nickname FROM profiles WHERE profiles.id = posts.user_id),
  (SELECT full_name FROM profiles WHERE profiles.id = posts.user_id),
  'Anonymous'
)
WHERE user_name = 'Anonymous' OR user_name IS NULL;

-- 5. Create a function to automatically update user_name when profiles are updated
CREATE OR REPLACE FUNCTION update_user_display_names()
RETURNS TRIGGER AS $$
BEGIN
  -- Update comments
  UPDATE comments 
  SET user_name = COALESCE(NEW.nickname, NEW.full_name, 'Anonymous')
  WHERE user_id = NEW.id;
  
  -- Update posts
  UPDATE posts 
  SET user_name = COALESCE(NEW.nickname, NEW.full_name, 'Anonymous')
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update display names when profile changes
DROP TRIGGER IF EXISTS update_display_names_trigger ON profiles;
CREATE TRIGGER update_display_names_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_display_names();

-- 7. Verify the updates worked
SELECT 'Comments with updated names:' as info;
SELECT id, user_name, content FROM comments LIMIT 5;

SELECT 'Posts with updated names:' as info;
SELECT id, user_name, title FROM posts LIMIT 5;

SELECT 'Profiles with nicknames:' as info;
SELECT id, nickname, full_name FROM profiles LIMIT 5;
