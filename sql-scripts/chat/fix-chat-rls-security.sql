-- Fix Chat RLS Security Issues
-- This script ensures proper Row Level Security is enforced for chat tables
-- Run this to fix the issue where all users can see the same conversations

-- Step 1: Drop all existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;

DROP POLICY IF EXISTS "direct_messages_select_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_insert_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_update_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_delete_policy" ON direct_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages to conversations they're in" ON direct_messages;

-- Step 2: Ensure RLS is enabled on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Step 3: Create secure RLS policies for conversations
-- Users can only SELECT conversations they participate in
CREATE POLICY "conversations_select_policy" ON conversations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM conversation_participants 
      WHERE conversation_participants.conversation_id = conversations.id 
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Users can only INSERT conversations where they are the creator
CREATE POLICY "conversations_insert_policy" ON conversations
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Users can only UPDATE conversations they created
CREATE POLICY "conversations_update_policy" ON conversations
  FOR UPDATE 
  USING (auth.uid() = created_by) 
  WITH CHECK (auth.uid() = created_by);

-- Users can only DELETE conversations they created
CREATE POLICY "conversations_delete_policy" ON conversations
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Step 4: Create secure RLS policies for conversation_participants
-- Users can only SELECT participants from conversations they are part of
CREATE POLICY "conversation_participants_select_policy" ON conversation_participants
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM conversation_participants cp2 
      WHERE cp2.conversation_id = conversation_participants.conversation_id 
        AND cp2.user_id = auth.uid()
    )
  );

-- Users can only INSERT themselves as participants
CREATE POLICY "conversation_participants_insert_policy" ON conversation_participants
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own participant record
CREATE POLICY "conversation_participants_update_policy" ON conversation_participants
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own participant record
CREATE POLICY "conversation_participants_delete_policy" ON conversation_participants
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 5: Create secure RLS policies for direct_messages
-- Users can only SELECT messages from conversations they participate in
CREATE POLICY "direct_messages_select_policy" ON direct_messages
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM conversation_participants 
      WHERE conversation_participants.conversation_id = direct_messages.conversation_id 
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Users can only INSERT messages to conversations they participate in, and must be the sender
CREATE POLICY "direct_messages_insert_policy" ON direct_messages
  FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 
      FROM conversation_participants 
      WHERE conversation_participants.conversation_id = direct_messages.conversation_id 
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Users can only UPDATE their own messages
CREATE POLICY "direct_messages_update_policy" ON direct_messages
  FOR UPDATE 
  USING (auth.uid() = sender_id) 
  WITH CHECK (auth.uid() = sender_id);

-- Users can only DELETE their own messages
CREATE POLICY "direct_messages_delete_policy" ON direct_messages
  FOR DELETE 
  USING (auth.uid() = sender_id);

-- Step 6: Verify RLS is working (commented out - uncomment to test)
-- This will show which policies are active
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('conversations', 'conversation_participants', 'direct_messages');

