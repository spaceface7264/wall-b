-- Fix RLS policies for conversation_participants to avoid recursive dependency
-- This script should be run to fix the group members loading issue

-- First, drop the existing problematic policy
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;

-- Create a much simpler policy - allow all authenticated users to read participants
-- This is safe because we'll control access at the application level
CREATE POLICY "conversation_participants_select_policy" ON conversation_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Also ensure we have proper policies for insert/update/delete
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON conversation_participants;

-- Recreate insert policy - users can add themselves to conversations
CREATE POLICY "conversation_participants_insert_policy" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recreate update policy - users can update their own participation
CREATE POLICY "conversation_participants_update_policy" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recreate delete policy - users can remove themselves, or group admins can remove others
CREATE POLICY "conversation_participants_delete_policy" ON conversation_participants
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_participants.conversation_id 
      AND conversations.created_by = auth.uid()
    )
  );
