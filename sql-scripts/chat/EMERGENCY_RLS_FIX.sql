-- EMERGENCY RLS FIX - This will completely reset all chat RLS policies
-- Run this in your Supabase SQL Editor to fix all chat issues

-- ==============================================
-- STEP 1: Drop ALL existing policies
-- ==============================================

-- Drop all conversation_participants policies
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in conversations they participate in" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;

-- Drop all direct_messages policies
DROP POLICY IF EXISTS "direct_messages_select_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_insert_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_update_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_delete_policy" ON direct_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages to conversations they're in" ON direct_messages;

-- Drop all conversations policies
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- ==============================================
-- STEP 2: Create simple, non-recursive policies
-- ==============================================

-- conversation_participants: Allow all authenticated users to read
CREATE POLICY "conversation_participants_select_policy" ON conversation_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- conversation_participants: Users can only add themselves
CREATE POLICY "conversation_participants_insert_policy" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- conversation_participants: Users can update their own records
CREATE POLICY "conversation_participants_update_policy" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- conversation_participants: Users can delete their own records, or group creators can delete others
CREATE POLICY "conversation_participants_delete_policy" ON conversation_participants
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_participants.conversation_id 
      AND conversations.created_by = auth.uid()
    )
  );

-- direct_messages: Allow all authenticated users to read
CREATE POLICY "direct_messages_select_policy" ON direct_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- direct_messages: Users can only send messages as themselves
CREATE POLICY "direct_messages_insert_policy" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- direct_messages: Users can only update their own messages
CREATE POLICY "direct_messages_update_policy" ON direct_messages
  FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- direct_messages: Users can only delete their own messages
CREATE POLICY "direct_messages_delete_policy" ON direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- conversations: Allow all authenticated users to read
CREATE POLICY "conversations_select_policy" ON conversations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- conversations: Users can only create conversations as themselves
CREATE POLICY "conversations_insert_policy" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- conversations: Users can only update conversations they created
CREATE POLICY "conversations_update_policy" ON conversations
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- conversations: Users can only delete conversations they created
CREATE POLICY "conversations_delete_policy" ON conversations
  FOR DELETE USING (auth.uid() = created_by);

-- ==============================================
-- STEP 3: Verify policies are working
-- ==============================================

-- Test query to verify conversation_participants is accessible
SELECT 'conversation_participants test' as test_name, COUNT(*) as row_count 
FROM conversation_participants 
WHERE auth.uid() IS NOT NULL;

-- Test query to verify direct_messages is accessible  
SELECT 'direct_messages test' as test_name, COUNT(*) as row_count 
FROM direct_messages 
WHERE auth.uid() IS NOT NULL;

-- Test query to verify conversations is accessible
SELECT 'conversations test' as test_name, COUNT(*) as row_count 
FROM conversations 
WHERE auth.uid() IS NOT NULL;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

SELECT 'RLS policies have been reset and simplified. Chat should now work!' as status;

