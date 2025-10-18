-- Test the function directly
-- Run this in your Supabase SQL Editor

-- Test if the function exists and works
SELECT get_or_create_direct_conversation(
  '00000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000002'::UUID
) as conversation_id;

-- Check if the conversation was created
SELECT * FROM conversations WHERE type = 'direct' ORDER BY created_at DESC LIMIT 1;

-- Check if participants were added
SELECT * FROM conversation_participants ORDER BY created_at DESC LIMIT 2;
