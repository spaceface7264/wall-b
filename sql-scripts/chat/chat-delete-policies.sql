-- Chat Delete Policies
-- Allows users to delete conversations they created or are participants in

-- Drop existing delete policies
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON conversation_participants;
DROP POLICY IF EXISTS "direct_messages_delete_policy" ON direct_messages;

-- Allow users to delete conversations they created
CREATE POLICY "conversations_delete_policy" ON conversations
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow users to remove themselves from conversations
CREATE POLICY "conversation_participants_delete_policy" ON conversation_participants
  FOR DELETE USING (user_id = auth.uid());

-- Allow users to delete their own messages
CREATE POLICY "direct_messages_delete_policy" ON direct_messages
  FOR DELETE USING (sender_id = auth.uid());
