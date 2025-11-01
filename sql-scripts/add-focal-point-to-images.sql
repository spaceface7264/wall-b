-- Add Focal Point Support to Images
-- Run this in your Supabase SQL Editor

-- Add focal point columns to gyms table
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS image_focal_x DECIMAL(5,4) DEFAULT 0.5;

ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS image_focal_y DECIMAL(5,4) DEFAULT 0.5;

-- Add focal point columns to gym_images table
ALTER TABLE gym_images 
ADD COLUMN IF NOT EXISTS focal_x DECIMAL(5,4) DEFAULT 0.5;

ALTER TABLE gym_images 
ADD COLUMN IF NOT EXISTS focal_y DECIMAL(5,4) DEFAULT 0.5;

-- Add focal point columns to profiles table (for avatars)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_focal_x DECIMAL(5,4) DEFAULT 0.5;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_focal_y DECIMAL(5,4) DEFAULT 0.5;

-- Add comments
COMMENT ON COLUMN gyms.image_focal_x IS 'Focal point X coordinate (0.0 to 1.0, where 0.5 is center)';
COMMENT ON COLUMN gyms.image_focal_y IS 'Focal point Y coordinate (0.0 to 1.0, where 0.5 is center)';
COMMENT ON COLUMN gym_images.focal_x IS 'Focal point X coordinate (0.0 to 1.0, where 0.5 is center)';
COMMENT ON COLUMN gym_images.focal_y IS 'Focal point Y coordinate (0.0 to 1.0, where 0.5 is center)';
COMMENT ON COLUMN profiles.avatar_focal_x IS 'Avatar focal point X coordinate (0.0 to 1.0, where 0.5 is center)';
COMMENT ON COLUMN profiles.avatar_focal_y IS 'Avatar focal point Y coordinate (0.0 to 1.0, where 0.5 is center)';

-- Add constraints to ensure values are between 0 and 1
ALTER TABLE gyms 
ADD CONSTRAINT gyms_image_focal_x_check CHECK (image_focal_x >= 0 AND image_focal_x <= 1);

ALTER TABLE gyms 
ADD CONSTRAINT gyms_image_focal_y_check CHECK (image_focal_y >= 0 AND image_focal_y <= 1);

ALTER TABLE gym_images 
ADD CONSTRAINT gym_images_focal_x_check CHECK (focal_x >= 0 AND focal_x <= 1);

ALTER TABLE gym_images 
ADD CONSTRAINT gym_images_focal_y_check CHECK (focal_y >= 0 AND focal_y <= 1);

ALTER TABLE profiles 
ADD CONSTRAINT profiles_avatar_focal_x_check CHECK (avatar_focal_x >= 0 AND avatar_focal_x <= 1);

ALTER TABLE profiles 
ADD CONSTRAINT profiles_avatar_focal_y_check CHECK (avatar_focal_y >= 0 AND avatar_focal_y <= 1);

