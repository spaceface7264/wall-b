-- Simple RLS Policies for Chat - No Recursion
-- Run this AFTER running chat-setup-fresh.sql

-- Drop any existing policies first
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;

DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON conversation_participants;

DROP POLICY IF EXISTS "direct_messages_select_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_insert_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_update_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_delete_policy" ON direct_messages;

-- Simple policies for conversations
CREATE POLICY "conversations_select_policy" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert_policy" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "conversations_update_policy" ON conversations
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "conversations_delete_policy" ON conversations
  FOR DELETE USING (auth.uid() = created_by);

-- Simple policies for conversation_participants
CREATE POLICY "conversation_participants_select_policy" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_insert_policy" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversation_participants_update_policy" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "conversation_participants_delete_policy" ON conversation_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Simple policies for direct_messages
CREATE POLICY "direct_messages_select_policy" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = direct_messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "direct_messages_insert_policy" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "direct_messages_update_policy" ON direct_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "direct_messages_delete_policy" ON direct_messages
  FOR DELETE USING (auth.uid() = sender_id);
