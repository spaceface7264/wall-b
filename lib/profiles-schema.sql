-- User Profiles Schema
-- Run this in your Supabase SQL Editor

-- Create profiles table for extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT,
  
  -- Climbing-specific fields
  climbing_grade TEXT, -- e.g., "5.12a", "V6"
  years_climbing INTEGER DEFAULT 0,
  favorite_style TEXT, -- e.g., "bouldering", "sport", "trad"
  home_gym_id UUID REFERENCES gyms(id),
  
  -- Social links
  instagram_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  
  -- Privacy settings
  show_email BOOLEAN DEFAULT FALSE,
  show_activity BOOLEAN DEFAULT TRUE,
  allow_direct_messages BOOLEAN DEFAULT TRUE,
  
  -- Activity counters
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  events_attended_count INTEGER DEFAULT 0,
  likes_given_count INTEGER DEFAULT 0,
  likes_received_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON profiles(full_name);
CREATE INDEX IF NOT EXISTS profiles_home_gym_id_idx ON profiles(home_gym_id);
CREATE INDEX IF NOT EXISTS profiles_last_active_at_idx ON profiles(last_active_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, company, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile activity counters
CREATE OR REPLACE FUNCTION update_profile_activity_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Update posts count
  IF TG_TABLE_NAME = 'posts' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE profiles 
      SET posts_count = posts_count + 1,
          updated_at = NOW()
      WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE profiles 
      SET posts_count = posts_count - 1,
          updated_at = NOW()
      WHERE id = OLD.user_id;
    END IF;
  END IF;

  -- Update comments count
  IF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE profiles 
      SET comments_count = comments_count + 1,
          updated_at = NOW()
      WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE profiles 
      SET comments_count = comments_count - 1,
          updated_at = NOW()
      WHERE id = OLD.user_id;
    END IF;
  END IF;

  -- Update likes given count
  IF TG_TABLE_NAME = 'likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE profiles 
      SET likes_given_count = likes_given_count + 1,
          updated_at = NOW()
      WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE profiles 
      SET likes_given_count = likes_given_count - 1,
          updated_at = NOW()
      WHERE id = OLD.user_id;
    END IF;
  END IF;

  -- Update likes received count (when someone likes your post/comment)
  IF TG_TABLE_NAME = 'likes' THEN
    IF TG_OP = 'INSERT' THEN
      -- Update likes received for post author
      UPDATE profiles 
      SET likes_received_count = likes_received_count + 1,
          updated_at = NOW()
      WHERE id = (
        SELECT user_id FROM posts WHERE id = NEW.post_id
      );
      
      -- Update likes received for comment author
      UPDATE profiles 
      SET likes_received_count = likes_received_count + 1,
          updated_at = NOW()
      WHERE id = (
        SELECT user_id FROM comments WHERE id = NEW.comment_id
      );
    ELSIF TG_OP = 'DELETE' THEN
      -- Decrease likes received for post author
      UPDATE profiles 
      SET likes_received_count = likes_received_count - 1,
          updated_at = NOW()
      WHERE id = (
        SELECT user_id FROM posts WHERE id = OLD.post_id
      );
      
      -- Decrease likes received for comment author
      UPDATE profiles 
      SET likes_received_count = likes_received_count - 1,
          updated_at = NOW()
      WHERE id = (
        SELECT user_id FROM comments WHERE id = OLD.comment_id
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activity counter updates
DROP TRIGGER IF EXISTS update_profile_posts_count ON posts;
CREATE TRIGGER update_profile_posts_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_profile_activity_counters();

DROP TRIGGER IF EXISTS update_profile_comments_count ON comments;
CREATE TRIGGER update_profile_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_profile_activity_counters();

DROP TRIGGER IF EXISTS update_profile_likes_count ON likes;
CREATE TRIGGER update_profile_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_profile_activity_counters();

-- Function to update last_active_at when user performs actions
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET last_active_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update last_active_at
DROP TRIGGER IF EXISTS update_profile_last_active_posts ON posts;
CREATE TRIGGER update_profile_last_active_posts
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

DROP TRIGGER IF EXISTS update_profile_last_active_comments ON comments;
CREATE TRIGGER update_profile_last_active_comments
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
