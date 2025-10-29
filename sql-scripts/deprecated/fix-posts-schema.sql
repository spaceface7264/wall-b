-- Fix posts table schema to add missing media_files column
-- Run this in your Supabase SQL Editor

-- Add media_files column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_files JSONB DEFAULT '[]'::jsonb;

-- Add comment to describe the column
COMMENT ON COLUMN posts.media_files IS 'Array of media file objects with url, type, name, and size';

-- Update existing posts to have empty media_files array if they don't have it
UPDATE posts 
SET media_files = '[]'::jsonb 
WHERE media_files IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name = 'media_files';

-- Test the column works
SELECT id, title, media_files FROM posts LIMIT 3;
