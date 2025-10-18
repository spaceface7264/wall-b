-- Fix Function Permissions and Signature
-- Run this in your Supabase SQL Editor

-- First, let's check if the function exists and what it looks like
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'get_or_create_direct_conversation';

-- Drop and recreate the function with proper permissions
DROP FUNCTION IF EXISTS get_or_create_direct_conversation(UUID, UUID);

-- Create the function with the exact signature the app expects
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp1 
      WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp2 
      WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
    )
  LIMIT 1;

  -- Create new conversation if none exists
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (type, created_by)
    VALUES ('direct', user1_id)
    RETURNING id INTO conversation_id;

    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_id, user1_id),
      (conversation_id, user2_id);
  END IF;

  RETURN conversation_id;
END;
$$;

-- Grant permissions to both authenticated and anon users
GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(UUID, UUID) TO anon;

-- Test the function with dummy data to make sure it works
SELECT get_or_create_direct_conversation(
  '00000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000002'::UUID
);
