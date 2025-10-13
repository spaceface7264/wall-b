-- Migration script to fix column name inconsistencies and add missing features
-- Run this in your Supabase SQL Editor to update existing databases

-- Step 1: Add reply_count column to comments table if it doesn't exist
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Step 2: Rename parent_id to parent_comment_id if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'comments' AND column_name = 'parent_id') THEN
        ALTER TABLE comments RENAME COLUMN parent_id TO parent_comment_id;
    END IF;
END $$;

-- Step 3: Update the index name
DROP INDEX IF EXISTS comments_parent_id_idx;
CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx ON comments(parent_comment_id);

-- Step 4: Create or replace the reply count update function
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count - 1 WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_comment_reply_count_trigger ON comments;
CREATE TRIGGER update_comment_reply_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- Step 6: Update existing reply counts for all comments
UPDATE comments 
SET reply_count = (
  SELECT COUNT(*) 
  FROM comments c2 
  WHERE c2.parent_comment_id = comments.id
);

-- Step 7: Ensure all necessary columns exist in posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS community_id UUID;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'general';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'post';

-- Step 8: Add constraints if they don't exist
DO $$ 
BEGIN
    -- Add post_type constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'posts_post_type_check') THEN
        ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
        CHECK (post_type IN ('post', 'beta', 'event', 'question', 'gear', 'training', 'social'));
    END IF;
END $$;

-- Step 9: Create missing indexes
CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS posts_community_id_idx ON posts(community_id);
CREATE INDEX IF NOT EXISTS posts_tag_idx ON posts(tag);
CREATE INDEX IF NOT EXISTS posts_post_type_idx ON posts(post_type);

-- Step 10: Verify the migration
SELECT 
    'Migration completed successfully' as status,
    (SELECT COUNT(*) FROM comments WHERE parent_comment_id IS NOT NULL) as total_replies,
    (SELECT COUNT(*) FROM comments WHERE reply_count > 0) as comments_with_replies;
