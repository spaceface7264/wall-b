-- Fix orphaned data before adding foreign key constraints
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what orphaned data we have
SELECT 'Checking for orphaned posts...' as status;

SELECT 
  p.id as post_id,
  p.title,
  p.user_id,
  pr.id as profile_exists
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE pr.id IS NULL
LIMIT 10;

SELECT 'Checking for orphaned comments...' as status;

SELECT 
  c.id as comment_id,
  c.content,
  c.user_id,
  pr.id as profile_exists
FROM comments c
LEFT JOIN profiles pr ON c.user_id = pr.id
WHERE pr.id IS NULL
LIMIT 10;

-- 2. Check for orphaned conversation participants
SELECT 'Checking for orphaned conversation participants...' as status;

SELECT 
  cp.user_id,
  pr.id as profile_exists
FROM conversation_participants cp
LEFT JOIN profiles pr ON cp.user_id = pr.id
WHERE pr.id IS NULL
LIMIT 10;

-- 3. Check for orphaned direct messages
SELECT 'Checking for orphaned direct messages...' as status;

SELECT 
  dm.id as message_id,
  dm.sender_id,
  pr.id as profile_exists
FROM direct_messages dm
LEFT JOIN profiles pr ON dm.sender_id = pr.id
WHERE pr.id IS NULL
LIMIT 10;

-- 4. Option A: Create missing profiles (if you want to keep the data)
-- Uncomment this section if you want to create profiles for missing users
/*
SELECT 'Creating missing profiles...' as status;

-- Insert missing profiles for posts
INSERT INTO profiles (id, email, full_name, nickname, created_at, updated_at)
SELECT DISTINCT 
  p.user_id,
  'unknown@example.com',
  'Unknown User',
  'Unknown User',
  NOW(),
  NOW()
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE pr.id IS NULL;

-- Insert missing profiles for comments
INSERT INTO profiles (id, email, full_name, nickname, created_at, updated_at)
SELECT DISTINCT 
  c.user_id,
  'unknown@example.com',
  'Unknown User',
  'Unknown User',
  NOW(),
  NOW()
FROM comments c
LEFT JOIN profiles pr ON c.user_id = pr.id
WHERE pr.id IS NULL;

-- Insert missing profiles for conversation participants
INSERT INTO profiles (id, email, full_name, nickname, created_at, updated_at)
SELECT DISTINCT 
  cp.user_id,
  'unknown@example.com',
  'Unknown User',
  'Unknown User',
  NOW(),
  NOW()
FROM conversation_participants cp
LEFT JOIN profiles pr ON cp.user_id = pr.id
WHERE pr.id IS NULL;

-- Insert missing profiles for direct messages
INSERT INTO profiles (id, email, full_name, nickname, created_at, updated_at)
SELECT DISTINCT 
  dm.sender_id,
  'unknown@example.com',
  'Unknown User',
  'Unknown User',
  NOW(),
  NOW()
FROM direct_messages dm
LEFT JOIN profiles pr ON dm.sender_id = pr.id
WHERE pr.id IS NULL;
*/

-- 5. Option B: Clean up orphaned data (if you want to remove it)
-- Uncomment this section if you want to delete orphaned data
/*
SELECT 'Cleaning up orphaned data...' as status;

-- Delete orphaned posts
DELETE FROM posts 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Delete orphaned comments
DELETE FROM comments 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Delete orphaned conversation participants
DELETE FROM conversation_participants 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Delete orphaned direct messages
DELETE FROM direct_messages 
WHERE sender_id NOT IN (SELECT id FROM profiles);
*/

-- 6. Now try to add the foreign key constraints
SELECT 'Adding foreign key constraints...' as status;

-- Add foreign key from posts.user_id to profiles.id
ALTER TABLE posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Add foreign key from comments.user_id to profiles.id  
ALTER TABLE comments 
ADD CONSTRAINT fk_comments_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Add foreign key from conversation_participants.user_id to profiles.id
ALTER TABLE conversation_participants 
ADD CONSTRAINT fk_conversation_participants_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Add foreign key from direct_messages.sender_id to profiles.id
ALTER TABLE direct_messages 
ADD CONSTRAINT fk_direct_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 7. Verify foreign keys were created
SELECT 'Verifying foreign key constraints...' as status;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('posts', 'comments', 'conversation_participants', 'direct_messages')
  AND ccu.table_name = 'profiles'
ORDER BY tc.table_name, kcu.column_name;

-- 8. Test the join queries work now
SELECT 'Testing posts-profiles join after FK fix...' as status;

SELECT 
  p.id,
  p.title,
  p.user_id,
  pr.nickname,
  pr.full_name
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
LIMIT 3;

SELECT 'Testing comments-profiles join after FK fix...' as status;

SELECT 
  c.id,
  c.content,
  c.user_id,
  pr.nickname,
  pr.full_name
FROM comments c
LEFT JOIN profiles pr ON c.user_id = pr.id
LIMIT 3;

SELECT 'Foreign key relationships fixed successfully!' as result;
