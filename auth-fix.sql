-- First, let's check if the tables exist and create them if they don't
-- This ensures we have the necessary tables before the trigger runs

-- Create user_contributions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL,
  contribution_value INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix the trigger function with proper error handling and syntax
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile entry
  BEGIN
    INSERT INTO profiles (id, full_name, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue execution
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
  END;
  
  -- Track the account creation as a contribution
  BEGIN
    INSERT INTO user_contributions (user_id, contribution_type, contribution_value)
    VALUES (NEW.id, 'account_created', 1);
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue execution
    RAISE NOTICE 'Error tracking contribution: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid errors when recreating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_contributions_user_id_idx ON user_contributions(user_id);
CREATE INDEX IF NOT EXISTS user_contributions_created_at_idx ON user_contributions(created_at);

-- Create view for aggregated daily contributions if it doesn't exist
CREATE OR REPLACE VIEW daily_contributions AS
SELECT 
  user_id,
  DATE_TRUNC('day', created_at) AS contribution_date,
  SUM(contribution_value) AS contribution_count
FROM 
  user_contributions
GROUP BY 
  user_id, DATE_TRUNC('day', created_at);
