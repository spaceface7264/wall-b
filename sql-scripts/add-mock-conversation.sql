    -- Add Mock Conversation to a Community
-- Run this in your Supabase SQL Editor
-- This creates a post with multiple comments to simulate a conversation

-- First, get a community ID (use the first active community)
DO $$
DECLARE
  v_community_id UUID;
  v_user_id_1 UUID;
  v_user_id_2 UUID;
  v_user_id_3 UUID;
  v_post_id UUID;
  v_comment_id_1 UUID;
  v_comment_id_2 UUID;
BEGIN
  -- Get the first active community
  SELECT id INTO v_community_id
  FROM communities
  WHERE is_active = TRUE
  LIMIT 1;
  
  -- Get some user IDs (use the first 3 users from profiles)
  SELECT id INTO v_user_id_1 FROM profiles LIMIT 1;
  SELECT id INTO v_user_id_2 FROM profiles OFFSET 1 LIMIT 1;
  SELECT id INTO v_user_id_3 FROM profiles OFFSET 2 LIMIT 1;
  
  -- If no users found, exit
  IF v_user_id_1 IS NULL THEN
    RAISE NOTICE 'No users found. Please create users first.';
    RETURN;
  END IF;
  
  -- If no community found, exit
  IF v_community_id IS NULL THEN
    RAISE NOTICE 'No active community found. Please create a community first.';
    RETURN;
  END IF;
  
  -- Get user emails and names
  DECLARE
    v_user_email_1 TEXT;
    v_user_name_1 TEXT;
    v_user_email_2 TEXT;
    v_user_name_2 TEXT;
    v_user_email_3 TEXT;
    v_user_name_3 TEXT;
  BEGIN
    SELECT email, COALESCE(nickname, full_name, 'Climber') INTO v_user_email_1, v_user_name_1
    FROM profiles WHERE id = v_user_id_1;
    
    IF v_user_id_2 IS NOT NULL THEN
      SELECT email, COALESCE(nickname, full_name, 'Climber') INTO v_user_email_2, v_user_name_2
      FROM profiles WHERE id = v_user_id_2;
    ELSE
      v_user_email_2 := 'climber2@example.com';
      v_user_name_2 := 'Alex';
    END IF;
    
    IF v_user_id_3 IS NOT NULL THEN
      SELECT email, COALESCE(nickname, full_name, 'Climber') INTO v_user_email_3, v_user_name_3
      FROM profiles WHERE id = v_user_id_3;
    ELSE
      v_user_email_3 := 'climber3@example.com';
      v_user_name_3 := 'Sam';
    END IF;
    
    -- Create the post
    INSERT INTO posts (
      user_id,
      user_email,
      user_name,
      community_id,
      title,
      content,
      tag,
      post_type,
      created_at
    ) VALUES (
      v_user_id_1,
      v_user_email_1,
      v_user_name_1,
      v_community_id,
      'Looking for climbing partner this weekend',
      'Hey everyone! I''m planning to hit the gym this Saturday morning around 9am. Anyone interested in joining? I''m working on some V4-V5 problems and would love some beta or just good company!',
      'social',
      'post',
      NOW() - INTERVAL '2 hours'
    )
    RETURNING id INTO v_post_id;
    
    RAISE NOTICE 'Created post with ID: %', v_post_id;
    
    -- Create first comment
    INSERT INTO comments (
      post_id,
      user_id,
      user_email,
      user_name,
      content,
      created_at
    ) VALUES (
      v_post_id,
      COALESCE(v_user_id_2, v_user_id_1),
      v_user_email_2,
      v_user_name_2,
      'I''d be down! What time are you thinking? I usually warm up around 8:30am.',
      NOW() - INTERVAL '1 hour 45 minutes'
    )
    RETURNING id INTO v_comment_id_1;
    
    RAISE NOTICE 'Created first comment with ID: %', v_comment_id_1;
    
    -- Create reply to first comment
    INSERT INTO comments (
      post_id,
      user_id,
      user_email,
      user_name,
      content,
      parent_comment_id,
      created_at
    ) VALUES (
      v_post_id,
      v_user_id_1,
      v_user_email_1,
      v_user_name_1,
      'Perfect! 8:30am works great. I''ll see you there!',
      v_comment_id_1,
      NOW() - INTERVAL '1 hour 30 minutes'
    );
    
    -- Create second comment
    INSERT INTO comments (
      post_id,
      user_id,
      user_email,
      user_name,
      content,
      created_at
    ) VALUES (
      v_post_id,
      COALESCE(v_user_id_3, v_user_id_1),
      v_user_email_3,
      v_user_name_3,
      'I might be able to make it! Which area are you planning to focus on?',
      NOW() - INTERVAL '1 hour'
    )
    RETURNING id INTO v_comment_id_2;
    
    -- Create reply to second comment
    INSERT INTO comments (
      post_id,
      user_id,
      user_email,
      user_name,
      content,
      parent_comment_id,
      created_at
    ) VALUES (
      v_post_id,
      v_user_id_1,
      v_user_email_1,
      v_user_name_1,
      'Probably the overhang section and maybe some slab work. Open to suggestions though!',
      v_comment_id_2,
      NOW() - INTERVAL '45 minutes'
    );
    
    -- Create another comment
    INSERT INTO comments (
      post_id,
      user_id,
      user_email,
      user_name,
      content,
      created_at
    ) VALUES (
      v_post_id,
      COALESCE(v_user_id_2, v_user_id_1),
      v_user_email_2,
      v_user_name_2,
      'Sounds like a plan! I''ll bring my chalk bag and we can share beta on those V5s.',
      NOW() - INTERVAL '30 minutes'
    );
    
    RAISE NOTICE 'Mock conversation created successfully!';
    RAISE NOTICE 'Post ID: %', v_post_id;
    RAISE NOTICE 'Community ID: %', v_community_id;
    
  END;
END $$;

-- Verify the conversation was created
SELECT 
  p.id as post_id,
  p.title,
  p.content,
  p.user_name as post_author,
  p.created_at as post_created,
  COUNT(DISTINCT c.id) as comment_count,
  COUNT(DISTINCT l.id) as like_count
FROM posts p
LEFT JOIN comments c ON c.post_id = p.id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.title = 'Looking for climbing partner this weekend'
GROUP BY p.id, p.title, p.content, p.user_name, p.created_at;

-- Show all comments for the post
SELECT 
  c.id,
  c.user_name,
  c.content,
  c.parent_comment_id,
  c.created_at,
  CASE WHEN c.parent_comment_id IS NULL THEN 'Top-level' ELSE 'Reply' END as comment_type
FROM comments c
INNER JOIN posts p ON p.id = c.post_id
WHERE p.title = 'Looking for climbing partner this weekend'
ORDER BY c.created_at ASC;

