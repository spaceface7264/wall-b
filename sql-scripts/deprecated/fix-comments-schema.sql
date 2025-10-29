-- Fix comments table schema to add missing user_name column
-- Run this in your Supabase SQL Editor

-- Add user_name column to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN comments.user_name IS 'Display name of the user who created the comment';

-- Update existing comments to have default values
UPDATE comments 
SET user_name = 'Anonymous'
WHERE user_name IS NULL;

-- Make the column NOT NULL with default
ALTER TABLE comments 
ALTER COLUMN user_name SET NOT NULL;

-- Set default value for future inserts
ALTER TABLE comments 
ALTER COLUMN user_name SET DEFAULT 'Anonymous';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND column_name = 'user_name';

-- Test the column works
SELECT id, content, user_name, created_at FROM comments LIMIT 3;
