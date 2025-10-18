-- Test Database Connection and Tables
-- Run this in your Supabase SQL Editor

-- Test if we can query the tables
SELECT 'conversations' as table_name, count(*) as row_count FROM conversations
UNION ALL
SELECT 'conversation_participants' as table_name, count(*) as row_count FROM conversation_participants
UNION ALL
SELECT 'direct_messages' as table_name, count(*) as row_count FROM direct_messages;

-- Test if the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_or_create_direct_conversation';

-- Test if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages');
