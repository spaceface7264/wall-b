-- FINAL RLS FIX - Comprehensive fix for all chat RLS issues
-- This script addresses the specific issue with joined queries failing

-- ==============================================
-- STEP 1: Drop ALL existing policies to start fresh
-- ==============================================

-- Drop all conversation_participants policies
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant entry" ON conversation_participants;
DROP POLICY IF EXISTS "Conversation creator or participant can delete participant entry" ON conversation_participants;

-- Drop all direct_messages policies
DROP POLICY IF EXISTS "direct_messages_select_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_insert_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_update_policy" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_delete_policy" ON direct_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON direct_messages;

-- Drop all conversations policies
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;
DROP POLICY IF EXISTS "Users can delete conversations they created" ON conversations;

-- ==============================================
-- STEP 2: Create simple, non-recursive policies
-- ==============================================

-- Enable RLS if not already enabled
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- conversation_participants policies
CREATE POLICY "conversation_participants_select_policy" ON conversation_participants
  FOR SELECT USING (true);

CREATE POLICY "conversation_participants_insert_policy" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversation_participants_update_policy" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversation_participants_delete_policy" ON conversation_participants
  FOR DELETE USING (auth.uid() = user_id);

-- direct_messages policies
CREATE POLICY "direct_messages_select_policy" ON direct_messages
  FOR SELECT USING (true);

CREATE POLICY "direct_messages_insert_policy" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "direct_messages_update_policy" ON direct_messages
  FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "direct_messages_delete_policy" ON direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- conversations policies
CREATE POLICY "conversations_select_policy" ON conversations
  FOR SELECT USING (true);

CREATE POLICY "conversations_insert_policy" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "conversations_update_policy" ON conversations
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "conversations_delete_policy" ON conversations
  FOR DELETE USING (auth.uid() = created_by);

-- ==============================================
-- STEP 3: Verify policies were created
-- ==============================================

-- Check that policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('conversation_participants', 'direct_messages', 'conversations')
ORDER BY tablename, policyname;

-- ==============================================
-- STEP 4: Test queries
-- ==============================================

-- Test basic access
SELECT 'conversation_participants' as table_name, count(*) as record_count FROM conversation_participants;
SELECT 'direct_messages' as table_name, count(*) as record_count FROM direct_messages;
SELECT 'conversations' as table_name, count(*) as record_count FROM conversations;

-- Test joined query
SELECT 
  cp.user_id,
  cp.joined_at,
  p.full_name,
  p.avatar_url
FROM conversation_participants cp
LEFT JOIN profiles p ON p.id = cp.user_id
LIMIT 5;

