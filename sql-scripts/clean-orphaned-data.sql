-- Clean orphaned data and fix foreign key constraints
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

-- 4. Delete orphaned data (RECOMMENDED for development)
-- This will remove all posts, comments, and messages from users who don't exist in profiles
DELETE FROM posts WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM comments WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM conversation_participants WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM direct_messages WHERE sender_id NOT IN (SELECT id FROM profiles);

-- 5. Now add the foreign key constraints
ALTER TABLE posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE comments 
ADD CONSTRAINT fk_comments_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE conversation_participants 
ADD CONSTRAINT fk_conversation_participants_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE direct_messages 
ADD CONSTRAINT fk_direct_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 6. Verify foreign keys were created
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('posts', 'comments', 'conversation_participants', 'direct_messages')
ORDER BY tc.table_name, tc.constraint_name;

-- 7. Test the join queries work
SELECT 'Testing posts-profiles join...' as status;

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

SELECT 
  c.id,
  c.content,
  c.user_name,
  pr.nickname,
  pr.full_name
FROM comments c
LEFT JOIN profiles pr ON c.user_id = pr.id
LIMIT 5;

SELECT 'All foreign keys and joins fixed successfully!' as result;



