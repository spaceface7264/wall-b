-- Test Group Chat Insert
-- Run this to test inserting a group conversation

-- First, let's see what your current user ID is
SELECT auth.uid() as current_user_id;

-- Then try to insert a test conversation
-- Replace 'test-group-name' with whatever you want to call it
INSERT INTO conversations (name, type, created_by) 
VALUES ('Test Group', 'group', auth.uid())
RETURNING *;
