-- Fresh Chat Database Setup - No Recursion Issues
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing tables and policies to start fresh
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Step 2: Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  type TEXT DEFAULT 'direct',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add constraint for type column
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check 
CHECK (type IN ('direct', 'group'));

-- Step 4: Create conversation_participants table
CREATE TABLE conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Step 5: Create direct_messages table
CREATE TABLE direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  read_by JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Add constraint for message_type column
ALTER TABLE direct_messages ADD CONSTRAINT direct_messages_type_check 
CHECK (message_type IN ('text', 'image', 'file'));

-- Step 7: Create indexes
CREATE INDEX conversations_created_at_idx ON conversations(created_at);
CREATE INDEX conversations_type_idx ON conversations(type);
CREATE INDEX conversation_participants_conversation_id_idx ON conversation_participants(conversation_id);
CREATE INDEX conversation_participants_user_id_idx ON conversation_participants(user_id);
CREATE INDEX direct_messages_conversation_id_created_at_idx ON direct_messages(conversation_id, created_at);
CREATE INDEX direct_messages_sender_id_idx ON direct_messages(sender_id);

-- Step 8: Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
