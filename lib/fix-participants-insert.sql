-- Fix conversation_participants insert policy
-- This allows users to add themselves and others to conversations

-- Drop existing insert policy
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;

-- Create new insert policy that allows any authenticated user to add participants
CREATE POLICY "conversation_participants_insert_policy" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure the select policy is simple (no recursion)
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;

CREATE POLICY "conversation_participants_select_policy" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid());
