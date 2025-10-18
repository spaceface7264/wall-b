-- Chat System Database Setup - Fixed Version
-- Run this script in your Supabase SQL Editor

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view their conversations" ON conversations;
DROP POLICY IF EXISTS "Allow authenticated users to create group conversations" ON conversations;
DROP POLICY IF EXISTS "Allow creator to update group conversation" ON conversations;
DROP POLICY IF EXISTS "Allow creator to delete group conversation" ON conversations;
DROP POLICY IF EXISTS "Allow authenticated users to view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Allow authenticated users to view messages in their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages into their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Allow authenticated users to update their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own messages" ON direct_messages;

-- Create conversations table for chat conversations
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT, -- Optional name for group conversations
  type TEXT DEFAULT 'direct',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add check constraint for type column
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check 
CHECK (type IN ('direct', 'group'));

-- Create conversation_participants table
CREATE TABLE conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create direct_messages table
CREATE TABLE direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT, -- For file attachments
  read_by JSONB DEFAULT '{}', -- Track who read the message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add check constraint for message_type column
ALTER TABLE direct_messages ADD CONSTRAINT direct_messages_type_check 
CHECK (message_type IN ('text', 'image', 'file'));

-- Create indexes for better performance
CREATE INDEX conversations_created_at_idx ON conversations(created_at);
CREATE INDEX conversations_type_idx ON conversations(type);
CREATE INDEX conversation_participants_conversation_id_idx ON conversation_participants(conversation_id);
CREATE INDEX conversation_participants_user_id_idx ON conversation_participants(user_id);
CREATE INDEX direct_messages_conversation_id_created_at_idx ON direct_messages(conversation_id, created_at);
CREATE INDEX direct_messages_sender_id_idx ON direct_messages(sender_id);

-- Enable Row Level Security (RLS) for all new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations - Simplified to avoid recursion
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
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "conversations_delete_policy" ON conversations
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for conversation_participants - Simplified
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
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversation_participants_delete_policy" ON conversation_participants
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for direct_messages - Simplified
CREATE POLICY "direct_messages_select_policy" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_participants.conversation_id = direct_messages.conversation_id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "direct_messages_insert_policy" ON direct_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_participants.conversation_id = direct_messages.conversation_id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "direct_messages_update_policy" ON direct_messages
  FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "direct_messages_delete_policy" ON direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Function to get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find an existing direct conversation between these two users
  SELECT c.id INTO conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE c.type = 'direct'
    AND cp1.user_id = user1_id
    AND cp2.user_id = user2_id
    AND cp1.user_id != cp2.user_id -- Ensure it's a conversation between two distinct users
  LIMIT 1;

  -- If no conversation found, create a new one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (type, created_by) VALUES ('direct', user1_id) RETURNING id INTO conversation_id;
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conversation_id, user1_id);
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conversation_id, user2_id);
  END IF;

  RETURN conversation_id;
END;
$$;

-- Grant permissions to the function
GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(UUID, UUID) TO authenticated;

-- Create trigger to update conversation updated_at when new messages are added
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

