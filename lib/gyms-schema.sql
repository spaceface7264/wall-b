-- Gyms Database Schema
-- Run this in your Supabase SQL Editor

-- Create gyms table
CREATE TABLE IF NOT EXISTS gyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  image_url TEXT,
  facilities JSONB DEFAULT '[]'::jsonb, -- Array of facility features
  opening_hours JSONB DEFAULT '{}'::jsonb, -- Opening hours for each day
  price_range TEXT, -- e.g., "€15-25", "$20-30"
  difficulty_levels TEXT[], -- Array of difficulty levels available
  wall_height TEXT, -- e.g., "4-5 meters"
  boulder_count INTEGER, -- Number of boulder problems
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add image_url column if it doesn't exist (for existing tables)
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create gym images table for multiple images per gym
CREATE TABLE IF NOT EXISTS gym_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gym reviews table
CREATE TABLE IF NOT EXISTS gym_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gym_id, user_id) -- One review per user per gym
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS gyms_country_city_idx ON gyms(country, city);
CREATE INDEX IF NOT EXISTS gyms_name_idx ON gyms(name);
CREATE INDEX IF NOT EXISTS gym_images_gym_id_idx ON gym_images(gym_id);
CREATE INDEX IF NOT EXISTS gym_images_primary_idx ON gym_images(gym_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS gym_reviews_gym_id_idx ON gym_reviews(gym_id);
CREATE INDEX IF NOT EXISTS gym_reviews_user_id_idx ON gym_reviews(user_id);
CREATE INDEX IF NOT EXISTS gym_reviews_rating_idx ON gym_reviews(gym_id, rating);

-- Enable Row Level Security
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_reviews ENABLE ROW LEVEL SECURITY;

-- Gyms policies (public read access)
DROP POLICY IF EXISTS "Allow public to read gyms" ON gyms;
CREATE POLICY "Allow public to read gyms" ON gyms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create gyms" ON gyms;
CREATE POLICY "Allow authenticated users to create gyms" ON gyms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update gyms" ON gyms;
CREATE POLICY "Allow authenticated users to update gyms" ON gyms
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete gyms" ON gyms;
CREATE POLICY "Allow authenticated users to delete gyms" ON gyms
  FOR DELETE USING (auth.role() = 'authenticated');

-- Gym images policies
DROP POLICY IF EXISTS "Allow public to read gym images" ON gym_images;
CREATE POLICY "Allow public to read gym images" ON gym_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create gym images" ON gym_images;
CREATE POLICY "Allow authenticated users to create gym images" ON gym_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update gym images" ON gym_images;
CREATE POLICY "Allow authenticated users to update gym images" ON gym_images
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete gym images" ON gym_images;
CREATE POLICY "Allow authenticated users to delete gym images" ON gym_images
  FOR DELETE USING (auth.role() = 'authenticated');

-- Gym reviews policies
DROP POLICY IF EXISTS "Allow public to read gym reviews" ON gym_reviews;
CREATE POLICY "Allow public to read gym reviews" ON gym_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create reviews" ON gym_reviews;
CREATE POLICY "Allow authenticated users to create reviews" ON gym_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own reviews" ON gym_reviews;
CREATE POLICY "Allow users to update their own reviews" ON gym_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own reviews" ON gym_reviews;
CREATE POLICY "Allow users to delete their own reviews" ON gym_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON gyms TO authenticated;
GRANT ALL ON gym_images TO authenticated;
GRANT ALL ON gym_reviews TO authenticated;
GRANT ALL ON gyms TO service_role;
GRANT ALL ON gym_images TO service_role;
GRANT ALL ON gym_reviews TO service_role;

-- Insert sample gym data
INSERT INTO gyms (name, country, city, address, phone, email, website, description, image_url, facilities, opening_hours, price_range, difficulty_levels, wall_height, boulder_count) VALUES
('The Climbing Hangar', 'United Kingdom', 'London', '123 Climbing Street, London E1 6AN', '+44 20 1234 5678', 'info@climbinghangar.com', 'https://climbinghangar.com', 'Premier bouldering gym in the heart of London with world-class facilities and routes for all levels.', 'https://images.unsplash.com/photo-1544551763-46a013bb2d26?w=800', '["Cafe", "Shop", "Training Area", "Yoga Studio", "Kids Area", "Locker Rooms"]', '{"monday": "6:00-23:00", "tuesday": "6:00-23:00", "wednesday": "6:00-23:00", "thursday": "6:00-23:00", "friday": "6:00-23:00", "saturday": "8:00-22:00", "sunday": "8:00-22:00"}', '£15-25', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert'], '4-5 meters', 200),

('Boulder World', 'Germany', 'Berlin', '456 Bouldering Boulevard, 10115 Berlin', '+49 30 12345678', 'berlin@boulderworld.de', 'https://boulderworld.de', 'Modern bouldering facility with innovative route setting and excellent training equipment.', 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800', '["Cafe", "Shop", "Training Area", "Sauna", "Massage", "Locker Rooms", "Parking"]', '{"monday": "7:00-24:00", "tuesday": "7:00-24:00", "wednesday": "7:00-24:00", "thursday": "7:00-24:00", "friday": "7:00-24:00", "saturday": "9:00-23:00", "sunday": "9:00-23:00"}', '€18-28', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Competition'], '4-6 meters', 300),

('Vertical Dreams', 'France', 'Paris', '789 Rue de l''Escalade, 75011 Paris', '+33 1 23 45 67 89', 'paris@verticaldreams.fr', 'https://verticaldreams.fr', 'Historic climbing gym with traditional charm and modern bouldering facilities in the heart of Paris.', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', '["Cafe", "Shop", "Training Area", "Yoga Studio", "Locker Rooms", "Equipment Rental"]', '{"monday": "6:30-22:30", "tuesday": "6:30-22:30", "wednesday": "6:30-22:30", "thursday": "6:30-22:30", "friday": "6:30-22:30", "saturday": "9:00-21:00", "sunday": "9:00-21:00"}', '€16-26', ARRAY['Beginner', 'Intermediate', 'Advanced'], '3.5-5 meters', 150),

('Rock Solid', 'Spain', 'Barcelona', '321 Carrer de la Paret, 08001 Barcelona', '+34 93 123 45 67', 'barcelona@rocksolid.es', 'https://rocksolid.es', 'Barcelona''s premier bouldering destination with Mediterranean vibes and challenging routes.', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', '["Cafe", "Shop", "Training Area", "Outdoor Terrace", "Locker Rooms", "Equipment Rental", "Parking"]', '{"monday": "7:00-23:00", "tuesday": "7:00-23:00", "wednesday": "7:00-23:00", "thursday": "7:00-23:00", "friday": "7:00-23:00", "saturday": "8:00-22:00", "sunday": "8:00-22:00"}', '€14-22', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert'], '4-5.5 meters', 250),

('Gravity Gym', 'Netherlands', 'Amsterdam', '654 Klimmuur Straat, 1012 Amsterdam', '+31 20 123 4567', 'amsterdam@gravitygym.nl', 'https://gravitygym.nl', 'Innovative bouldering gym with unique route setting and a vibrant climbing community.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', '["Cafe", "Shop", "Training Area", "Yoga Studio", "Kids Area", "Locker Rooms", "Bike Storage"]', '{"monday": "6:00-24:00", "tuesday": "6:00-24:00", "wednesday": "6:00-24:00", "thursday": "6:00-24:00", "friday": "6:00-24:00", "saturday": "8:00-23:00", "sunday": "8:00-23:00"}', '€16-24', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Competition'], '4-6 meters', 280),

('Summit Boulder', 'Italy', 'Milan', '987 Via della Scala, 20121 Milano', '+39 02 1234 5678', 'milan@summitboulder.it', 'https://summitboulder.it', 'Modern bouldering facility in Milan with state-of-the-art equipment and expert route setters.', 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800', '["Cafe", "Shop", "Training Area", "Sauna", "Massage", "Locker Rooms", "Parking", "Equipment Rental"]', '{"monday": "7:00-23:00", "tuesday": "7:00-23:00", "wednesday": "7:00-23:00", "thursday": "7:00-23:00", "friday": "7:00-23:00", "saturday": "9:00-22:00", "sunday": "9:00-22:00"}', '€17-27', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert'], '4-5 meters', 220),

('Beta Climbing', 'Switzerland', 'Zurich', '147 Klettergasse, 8001 Zürich', '+41 44 123 45 67', 'zurich@betaclimbing.ch', 'https://betaclimbing.ch', 'Swiss precision meets bouldering excellence in this world-class climbing facility.', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', '["Cafe", "Shop", "Training Area", "Yoga Studio", "Sauna", "Locker Rooms", "Equipment Rental", "Parking"]', '{"monday": "6:30-23:00", "tuesday": "6:30-23:00", "wednesday": "6:30-23:00", "thursday": "6:30-23:00", "friday": "6:30-23:00", "saturday": "8:00-22:00", "sunday": "8:00-22:00"}', 'CHF 20-30', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Competition'], '4-6 meters', 320),

('Crag Central', 'Austria', 'Vienna', '258 Felsstraße, 1010 Wien', '+43 1 123 456 78', 'vienna@cragcentral.at', 'https://cragcentral.at', 'Vienna''s premier bouldering destination with traditional Austrian hospitality and modern facilities.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', '["Cafe", "Shop", "Training Area", "Yoga Studio", "Kids Area", "Locker Rooms", "Equipment Rental"]', '{"monday": "7:00-22:30", "tuesday": "7:00-22:30", "wednesday": "7:00-22:30", "thursday": "7:00-22:30", "friday": "7:00-22:30", "saturday": "9:00-21:00", "sunday": "9:00-21:00"}', '€15-25', ARRAY['Beginner', 'Intermediate', 'Advanced'], '3.5-5 meters', 180),

('Summit Climbing Center', 'United States', 'Boulder', '321 Mountain View Drive, Boulder, CO 80301', '+1 303 555 9876', 'info@summitclimbing.com', 'https://summitclimbing.com', 'State-of-the-art climbing facility with world-class bouldering walls, lead climbing routes, and comprehensive training programs for climbers of all skill levels.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', '["Cafe", "Shop", "Training Area", "Yoga Studio", "Kids Area", "Locker Rooms", "Parking", "Equipment Rental", "Bike Storage"]', '{"monday": "5:00-23:00", "tuesday": "5:00-23:00", "wednesday": "5:00-23:00", "thursday": "5:00-23:00", "friday": "5:00-23:00", "saturday": "7:00-22:00", "sunday": "7:00-22:00"}', '$22-32', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Competition'], '5-15 meters', 250);
