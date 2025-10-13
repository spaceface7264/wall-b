-- Storage Bucket Setup
-- Run this in your Supabase SQL Editor

-- Note: Storage buckets must be created via the Supabase Dashboard
-- This file contains the RLS policies for the buckets

-- Create storage buckets (run these in Supabase Dashboard > Storage)
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "New bucket"
-- 3. Create bucket named "avatars" (public: true)
-- 4. Create bucket named "post-media" (public: true)

-- RLS Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policies for post-media bucket
CREATE POLICY "Post media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-media' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own post media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'post-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to generate unique file names for avatars
CREATE OR REPLACE FUNCTION generate_avatar_filename(user_id UUID, file_extension TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::text || '/' || extract(epoch from now())::bigint || '.' || file_extension;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique file names for post media
CREATE OR REPLACE FUNCTION generate_post_media_filename(user_id UUID, post_id UUID, file_extension TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::text || '/' || post_id::text || '/' || extract(epoch from now())::bigint || '.' || file_extension;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_avatar_filename TO authenticated;
GRANT EXECUTE ON FUNCTION generate_post_media_filename TO authenticated;
