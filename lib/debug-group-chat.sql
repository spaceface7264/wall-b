-- Debug Group Chat Creation
-- Run this to check what's happening with group chat creation

-- Check if conversations table exists and has correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Check RLS policies on conversations table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'conversations';

-- Test inserting a conversation (this will show the actual error)
-- Replace 'your-user-id-here' with your actual user ID
-- INSERT INTO conversations (name, type, created_by) 
-- VALUES ('Test Group', 'group', 'your-user-id-here');
