# Chat System Setup

This document explains how to set up the real-time chat system.

## Features

- **Real-time messaging** using Supabase real-time subscriptions
- **Message persistence** with database storage
- **User authentication** integration
- **Responsive design** with minimalistic styling
- **Auto-scroll** to latest messages

## Database Setup

### 1. Run the Database Schema

Execute the SQL schema in your Supabase SQL Editor:

```sql
-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all messages
CREATE POLICY "Allow authenticated users to read messages" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert their own messages
CREATE POLICY "Allow authenticated users to insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO service_role;
```

### 2. Enable Real-time

In your Supabase dashboard:
1. Go to **Database** → **Replication**
2. Enable real-time for the `messages` table
3. Set up the publication for `messages`

## Environment Variables

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage

1. **Navigate to Chat**: Click the "Chat" button in the sidebar
2. **Send Messages**: Type in the input box and press Enter or click Send
3. **Real-time Updates**: Messages appear instantly for all connected users
4. **Message History**: All messages are persisted and loaded on page refresh

## Technical Details

### Components

- **`/app/chat/page.jsx`**: Main chat interface
- **`/lib/messages-schema.sql`**: Database schema
- **`/lib/setup-chat-db.js`**: Database setup script

### Real-time Flow

1. User types message → clicks send
2. Message saves to Supabase database
3. Supabase real-time broadcasts to all connected users
4. All clients receive the new message via WebSocket
5. Message list updates instantly

### Security

- **Row Level Security (RLS)** enabled
- **Authentication required** to send/receive messages
- **User isolation** - users can only insert their own messages
- **Public read access** for all authenticated users

## Troubleshooting

### Messages not appearing in real-time
- Check if real-time is enabled for the `messages` table
- Verify RLS policies are correctly set up
- Check browser console for WebSocket connection errors

### Database connection issues
- Verify environment variables are correct
- Check Supabase project status
- Ensure service role key has proper permissions

### Authentication issues
- Make sure user is logged in
- Check if Supabase auth is properly configured
- Verify user session is valid
