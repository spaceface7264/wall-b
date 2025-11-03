-- Add hidden column to user_favorite_gyms table
ALTER TABLE user_favorite_gyms 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- Create index for filtering visible favorites
CREATE INDEX IF NOT EXISTS idx_user_favorite_gyms_hidden 
ON user_favorite_gyms(user_id, hidden);

-- Add UPDATE policy if it doesn't exist
DROP POLICY IF EXISTS "Users can update their own favorite gyms" ON user_favorite_gyms;
CREATE POLICY "Users can update their own favorite gyms" ON user_favorite_gyms
  FOR UPDATE USING (auth.uid() = user_id);

