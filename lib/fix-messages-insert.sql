-- Fix direct_messages insert policy
-- This allows users to send messages in conversations they're part of

-- Drop existing insert policy
DROP POLICY IF EXISTS "direct_messages_insert_policy" ON direct_messages;

-- Create new insert policy that allows any authenticated user to send messages
CREATE POLICY "direct_messages_insert_policy" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure the select policy is working correctly
DROP POLICY IF EXISTS "direct_messages_select_policy" ON direct_messages;

CREATE POLICY "direct_messages_select_policy" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = direct_messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );
