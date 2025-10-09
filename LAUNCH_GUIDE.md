# 🚀 Wall-B Launch Guide

## ✅ Wall-B is Ready!

Your Wall-B bouldering community app is now configured and ready to launch with the provided Supabase credentials.

## 🔧 Database Setup Required

To complete the setup, you need to create the database tables:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project: `xnxdxuoecnulcoapawtu`

### Step 2: Create Messages Table
1. Go to **SQL Editor**
2. Copy and paste this SQL:

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

3. Click **Run** to execute

### Step 3: Enable Real-time
1. Go to **Database** → **Replication**
2. Find the **messages** table
3. Toggle **ON** real-time for the messages table

### Step 4: Create Storage Bucket (Required for Profile Pictures)
1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it **avatars**
4. Set it to **Public** (uncheck "Private bucket")
5. Click **Create bucket**

## 🚀 Launch Commands

```bash
# Development (already running)
npm run dev

# Production
npm run build
npm start
```

## 📱 App Features

- **Authentication**: Login with email/password
- **Dashboard**: Main page after login
- **Profile**: User profile management with avatar upload
- **Community**: Social feed with posts
- **Chat**: Real-time messaging
- **Setup**: Database setup guide

## 🌐 Access Your App

- **Local**: http://localhost:3000
- **Production**: Deploy to Vercel, Netlify, or your preferred platform

## 🔐 Test Users

Create test users through the Supabase Auth dashboard or use the sign-up flow in the app.

---

**Your app is ready to launch! 🎉**
