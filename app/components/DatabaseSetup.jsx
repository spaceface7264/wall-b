

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Loader, Copy, ExternalLink, AlertCircle } from 'lucide-react';

export default function DatabaseSetup() {
  const [health, setHealth] = useState({
    conversations: 'checking',
    conversation_participants: 'checking',
    direct_messages: 'checking'
  });
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  const checkDatabaseHealth = async () => {
    await checkTableHealth('conversations');
    await checkTableHealth('conversation_participants');
    await checkTableHealth('direct_messages');
  };

  const checkTableHealth = async (tableName) => {
    try {
      const { data, error } = await supabase.from(tableName).select('id').limit(1);
      if (error) {
        console.error(`Health check for ${tableName} failed:`, error);
        setHealth(prev => ({ ...prev, [tableName]: 'error' }));
      } else {
        setHealth(prev => ({ ...prev, [tableName]: 'ok' }));
      }
    } catch (err) {
      console.error(`Exception during health check for ${tableName}:`, err);
      setHealth(prev => ({ ...prev, [tableName]: 'error' }));
    }
  };


  const allOk = Object.values(health).every(status => status === 'ok');
  const anyError = Object.values(health).some(status => status === 'error');

  const sqlScript = `-- Chat System Database Setup - Fixed Version
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
  EXECUTE FUNCTION update_conversation_updated_at();`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  if (allOk) return null; // Don't show if everything is healthy

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 border-t border-gray-700 z-40">
      <div className="max-w-4xl mx-auto text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Database Setup Required
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              {anyError ? (
                <>
                  <span className="text-red-400">Chat tables missing!</span> Please set up the database schema to enable chat functionality.
                </>
              ) : (
                <span className="text-yellow-400">Checking database tables...</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowSql(!showSql)}
            className="px-3 py-1 bg-[#00d4ff] text-white text-sm rounded hover:bg-[#00b8e6] transition-colors"
          >
            {showSql ? 'Hide' : 'Show'} SQL
          </button>
        </div>

        {/* Health Check Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {Object.entries(health).map(([key, status]) => (
            <div key={key} className="flex items-center text-sm bg-gray-700 p-2 rounded">
              {status === 'ok' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
              {status === 'error' && <XCircle className="w-4 h-4 text-red-500 mr-2" />}
              {status === 'checking' && <Loader className="w-4 h-4 text-gray-500 mr-2 animate-spin" />}
              <span className={status === 'error' ? 'text-red-400' : ''}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>

        {/* SQL Script */}
        {showSql && (
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">SQL Setup Script</h4>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={openSupabaseDashboard}
                  className="flex items-center gap-1 px-3 py-1 bg-[#00d4ff] text-white text-sm rounded hover:bg-[#00b8e6] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Supabase
                </button>
              </div>
            </div>
            <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {sqlScript}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-400">
          <p className="mb-2">
            <strong>Setup Instructions:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Open your Supabase Dashboard</li>
            <li>Go to the SQL Editor</li>
            <li>Copy and paste the SQL script above</li>
            <li>Run the script to create the required tables</li>
            <li>Refresh this page to verify the setup</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
