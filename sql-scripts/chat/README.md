# Chat System SQL Scripts

This directory contains all the SQL scripts needed to set up the chat functionality.

## Setup Order

1. **`chat-setup-fresh.sql`** - Creates the core chat tables (conversations, conversation_participants, direct_messages)
2. **`chat-function-simple.sql`** - Creates the RPC function for direct conversation creation
3. **`chat-policies-fixed.sql`** - Sets up the RLS policies (fixed version without recursion)
4. **`enable-realtime.sql`** - Enables Supabase Realtime for live messaging

## Quick Setup

Run these scripts in order in your Supabase SQL Editor:

```sql
-- 1. Create tables
\i chat-setup-fresh.sql

-- 2. Create functions
\i chat-function-simple.sql

-- 3. Set up policies
\i chat-policies-fixed.sql

-- 4. Enable realtime
\i enable-realtime.sql
```

## What Each Script Does

- **chat-setup-fresh.sql**: Creates the main chat tables with proper relationships
- **chat-function-simple.sql**: Creates `get_or_create_direct_conversation()` RPC function
- **chat-policies-fixed.sql**: Sets up Row Level Security policies for chat data
- **enable-realtime.sql**: Enables real-time subscriptions for live messaging

## Features Enabled

After running these scripts, you'll have:
- ✅ Direct messaging between users
- ✅ Group chat creation and management
- ✅ Real-time message updates
- ✅ Typing indicators
- ✅ Message read status tracking
- ✅ Proper security with RLS policies
