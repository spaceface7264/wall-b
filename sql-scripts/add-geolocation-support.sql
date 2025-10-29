-- Add Geolocation Support to Database
-- This migration adds latitude/longitude columns and indexes for location-based queries

-- Add geolocation columns to gyms table
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add geolocation columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add geolocation columns to user profiles (optional - for storing user location preference)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_preference_radius INTEGER DEFAULT 50; -- in kilometers

-- Create indexes for geolocation queries (using GIST for spatial queries)
-- Note: For basic distance queries, regular indexes work fine, but if you want to use PostGIS later, use GIST
CREATE INDEX IF NOT EXISTS gyms_location_idx ON gyms USING GIST (point(longitude, latitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS events_location_idx ON events USING GIST (point(longitude, latitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- If the above GIST index fails (PostGIS not enabled), use regular btree indexes instead:
-- CREATE INDEX IF NOT EXISTS gyms_lat_lng_idx ON gyms(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS events_lat_lng_idx ON events(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create a function to calculate distance using Haversine formula
-- This function calculates distance in kilometers between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  earth_radius_km DOUBLE PRECISION := 6371;
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius_km * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to find nearby gyms
CREATE OR REPLACE FUNCTION find_nearby_gyms(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.country,
    g.city,
    g.address,
    g.latitude,
    g.longitude,
    calculate_distance(user_lat, user_lon, g.latitude, g.longitude) AS distance_km
  FROM gyms g
  WHERE g.latitude IS NOT NULL 
    AND g.longitude IS NOT NULL
    AND calculate_distance(user_lat, user_lon, g.latitude, g.longitude) <= radius_km
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find nearby events
CREATE OR REPLACE FUNCTION find_nearby_events(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  created_by UUID,
  title TEXT,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.community_id,
    e.created_by,
    e.title,
    e.description,
    e.event_date,
    e.event_type,
    e.location,
    e.latitude,
    e.longitude,
    calculate_distance(user_lat, user_lon, e.latitude, e.longitude) AS distance_km
  FROM events e
  WHERE e.latitude IS NOT NULL 
    AND e.longitude IS NOT NULL
    AND e.event_date >= NOW() -- Only future events
    AND calculate_distance(user_lat, user_lon, e.latitude, e.longitude) <= radius_km
  ORDER BY distance_km ASC, e.event_date ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_distance IS 'Calculates distance between two coordinates in kilometers using Haversine formula';
COMMENT ON FUNCTION find_nearby_gyms IS 'Finds gyms within specified radius from user location';
COMMENT ON FUNCTION find_nearby_events IS 'Finds future events within specified radius from user location';

-- Success message
SELECT 'Geolocation support added successfully! Columns and functions created.' as status;

