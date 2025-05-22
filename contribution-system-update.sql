-- Add new contribution types to the database

-- First, let's ensure the user_contributions table exists
CREATE TABLE IF NOT EXISTS user_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL,
  contribution_value INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS user_contributions_user_id_idx ON user_contributions(user_id);
CREATE INDEX IF NOT EXISTS user_contributions_created_at_idx ON user_contributions(created_at);
CREATE INDEX IF NOT EXISTS user_contributions_type_idx ON user_contributions(contribution_type);

-- Create or replace the daily_contributions view
CREATE OR REPLACE VIEW daily_contributions AS
SELECT 
  user_id,
  DATE_TRUNC('day', created_at) AS contribution_date,
  SUM(contribution_value) AS contribution_count,
  jsonb_agg(
    jsonb_build_object(
      'type', contribution_type,
      'value', contribution_value,
      'time', to_char(created_at, 'HH24:MI:SS'),
      'metadata', metadata
    )
  ) AS details
FROM 
  user_contributions
GROUP BY 
  user_id, DATE_TRUNC('day', created_at);

-- Create a function to track app opens (once per day)
CREATE OR REPLACE FUNCTION track_app_open()
RETURNS TRIGGER AS $$
DECLARE
  last_open TIMESTAMP;
  today DATE := CURRENT_DATE;
BEGIN
  -- Check if user already opened app today
  SELECT MAX(created_at) INTO last_open
  FROM user_contributions
  WHERE user_id = NEW.user_id
    AND contribution_type = 'app_opened'
    AND DATE(created_at) = today;
    
  -- If no record for today, insert a new contribution
  IF last_open IS NULL THEN
    INSERT INTO user_contributions (
      user_id,
      contribution_type,
      contribution_value,
      metadata
    ) VALUES (
      NEW.user_id,
      'app_opened',
      1,
      jsonb_build_object('date', today)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to track streak milestones
CREATE OR REPLACE FUNCTION check_streak_milestone()
RETURNS TRIGGER AS $$
DECLARE
  streak_days INT;
  last_milestone INT;
BEGIN
  -- Calculate current streak
  WITH consecutive_days AS (
    SELECT 
      user_id,
      DATE(created_at) as activity_date,
      ROW_NUMBER() OVER (ORDER BY DATE(created_at) DESC) as row_num
    FROM (
      SELECT DISTINCT user_id, DATE(created_at) as created_at
      FROM user_contributions
      WHERE user_id = NEW.user_id
    ) as distinct_dates
    ORDER BY activity_date DESC
  ),
  streak AS (
    SELECT 
      COUNT(*) as days
    FROM consecutive_days c1
    WHERE NOT EXISTS (
      SELECT 1 FROM consecutive_days c2
      WHERE c2.row_num = c1.row_num - 1
        AND c2.activity_date <> c1.activity_date - INTERVAL '1 day'
    )
  )
  SELECT days INTO streak_days FROM streak;
  
  -- Check if we've reached a milestone (7, 14, 30, 60, 90, etc.)
  IF streak_days IN (7, 14, 30, 60, 90, 180, 365) THEN
    -- Check if we've already awarded this milestone
    SELECT MAX(CAST(metadata->>'streak_days' AS INT)) INTO last_milestone
    FROM user_contributions
    WHERE user_id = NEW.user_id
      AND contribution_type = 'streak_milestone';
      
    -- Only award if this is a new milestone
    IF last_milestone IS NULL OR streak_days > last_milestone THEN
      INSERT INTO user_contributions (
        user_id,
        contribution_type,
        contribution_value,
        metadata
      ) VALUES (
        NEW.user_id,
        'streak_milestone',
        3, -- Higher value for streak milestones
        jsonb_build_object(
          'streak_days', streak_days,
          'date', CURRENT_DATE
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to check for streak milestones when new contributions are added
DROP TRIGGER IF EXISTS check_streak_milestone_trigger ON user_contributions;
CREATE TRIGGER check_streak_milestone_trigger
AFTER INSERT ON user_contributions
FOR EACH ROW
EXECUTE FUNCTION check_streak_milestone();
