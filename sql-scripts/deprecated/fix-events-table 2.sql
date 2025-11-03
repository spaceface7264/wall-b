-- Fix Events Table - Ensure it exists and has correct structure
-- Run this in your Supabase SQL Editor

-- First, check if events table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
        -- Create events table if it doesn't exist
        CREATE TABLE events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
            created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
            event_type TEXT DEFAULT 'meetup' CHECK (event_type IN ('meetup', 'competition', 'training', 'social')),
            location TEXT,
            max_participants INTEGER,
            is_recurring BOOLEAN DEFAULT FALSE,
            recurrence_pattern TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS events_community_id_idx ON events(community_id);
        CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date);
        CREATE INDEX IF NOT EXISTS events_created_by_idx ON events(created_by);
        
        -- Enable RLS
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view events in communities they belong to" ON events
            FOR SELECT USING (
                community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can create events in communities they belong to" ON events
            FOR INSERT WITH CHECK (
                created_by = auth.uid() AND
                community_id IN (
                    SELECT community_id FROM community_members 
                    WHERE user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can update events they created" ON events
            FOR UPDATE USING (created_by = auth.uid());
        
        CREATE POLICY "Users can delete events they created" ON events
            FOR DELETE USING (created_by = auth.uid());
        
        RAISE NOTICE 'Events table created successfully';
    ELSE
        RAISE NOTICE 'Events table already exists';
    END IF;
END $$;

-- Check if profiles table exists and has the right structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Create profiles table if it doesn't exist
        CREATE TABLE profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            bio TEXT,
            avatar_url TEXT,
            company TEXT,
            role TEXT,
            climbing_grade TEXT,
            years_climbing INTEGER DEFAULT 0,
            favorite_style TEXT,
            home_gym_id UUID REFERENCES gyms(id),
            instagram_url TEXT,
            twitter_url TEXT,
            website_url TEXT,
            show_email BOOLEAN DEFAULT FALSE,
            show_activity BOOLEAN DEFAULT TRUE,
            allow_direct_messages BOOLEAN DEFAULT TRUE,
            posts_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            events_attended_count INTEGER DEFAULT 0,
            likes_given_count INTEGER DEFAULT 0,
            likes_received_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view all profiles" ON profiles
            FOR SELECT USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Users can update their own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Users can insert their own profile" ON profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        RAISE NOTICE 'Profiles table created successfully';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;
END $$;

-- Insert some test events if none exist
INSERT INTO events (id, community_id, created_by, title, description, event_date, event_type, location, max_participants)
SELECT 
    gen_random_uuid(),
    c.id,
    (SELECT id FROM auth.users LIMIT 1),
    'Test Event ' || c.name,
    'This is a test event for ' || c.name,
    NOW() + INTERVAL '7 days',
    'meetup',
    'Main Area',
    20
FROM communities c
WHERE NOT EXISTS (SELECT 1 FROM events LIMIT 1)
LIMIT 3;

-- Verify the tables exist and have data
SELECT 
    'events' as table_name, 
    COUNT(*) as row_count 
FROM events
UNION ALL
SELECT 
    'profiles' as table_name, 
    COUNT(*) as row_count 
FROM profiles
UNION ALL
SELECT 
    'communities' as table_name, 
    COUNT(*) as row_count 
FROM communities;
