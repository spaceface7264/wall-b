-- Create user_favorite_gyms table
CREATE TABLE IF NOT EXISTS user_favorite_gyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of user and gym
  UNIQUE(user_id, gym_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorite_gyms_user_id ON user_favorite_gyms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_gyms_gym_id ON user_favorite_gyms(gym_id);

-- Enable Row Level Security
ALTER TABLE user_favorite_gyms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorite gyms" ON user_favorite_gyms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite gyms" ON user_favorite_gyms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite gyms" ON user_favorite_gyms
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_favorite_gyms_updated_at
  BEFORE UPDATE ON user_favorite_gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
