-- Fix missing foreign key relationships
-- Run this in your Supabase SQL Editor

-- 1. Add foreign key from posts.user_id to profiles.id
ALTER TABLE posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 2. Add foreign key from comments.user_id to profiles.id  
ALTER TABLE comments 
ADD CONSTRAINT fk_comments_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 3. Add foreign key from conversation_participants.user_id to profiles.id
ALTER TABLE conversation_participants 
ADD CONSTRAINT fk_conversation_participants_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 4. Add foreign key from direct_messages.sender_id to profiles.id
ALTER TABLE direct_messages 
ADD CONSTRAINT fk_direct_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 5. Verify foreign keys were created
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

-- 6. Test the join queries work now
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
