-- Simple Fix for Group Chat Creation
-- Run this to allow any authenticated user to create group chats

-- Drop existing policies
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;

-- Create simpler policies for conversations
CREATE POLICY "conversations_select_policy" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow any authenticated user to create conversations
CREATE POLICY "conversations_insert_policy" ON conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow creator to update their conversations
CREATE POLICY "conversations_update_policy" ON conversations
  FOR UPDATE USING (auth.uid() = created_by);

-- Allow creator to delete their conversations
CREATE POLICY "conversations_delete_policy" ON conversations
  FOR DELETE USING (auth.uid() = created_by);
