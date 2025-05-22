-- Create a function to get user contributions with better performance
CREATE OR REPLACE FUNCTION get_user_contributions(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH daily_contribs AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS date,
      SUM(contribution_value) AS count,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'type', contribution_type,
          'value', contribution_value,
          'time', TO_CHAR(created_at, 'HH24:MI:SS'),
          'metadata', metadata
        )
      ) AS details
    FROM user_contributions
    WHERE user_id = user_id_param
    GROUP BY DATE_TRUNC('day', created_at)
  )
  SELECT 
    JSONB_OBJECT_AGG(date, JSONB_BUILD_OBJECT('count', count, 'details', details))
  INTO result
  FROM daily_contribs;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user stats with better performance
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  total_contributions INT;
  current_streak INT;
  longest_streak INT;
  sets_count INT;
  total_cards_studied INT;
  contributions_by_type JSONB;
BEGIN
  -- Get total contributions
  SELECT COALESCE(SUM(contribution_value), 0)
  INTO total_contributions
  FROM user_contributions
  WHERE user_id = user_id_param;
  
  -- Get current streak
  WITH consecutive_days AS (
    SELECT 
      date,
      date - (ROW_NUMBER() OVER (ORDER BY date))::INTEGER AS grp
    FROM (
      SELECT DISTINCT DATE_TRUNC('day', created_at)::DATE as date
      FROM user_contributions
      WHERE user_id = user_id_param
      ORDER BY date DESC
    ) dates
  ),
  groups AS (
    SELECT 
      grp,
      COUNT(*) as streak_length,
      MAX(date) as latest_date
    FROM consecutive_days
    GROUP BY grp
    ORDER BY latest_date DESC
  )
  SELECT 
    CASE 
      WHEN MAX(latest_date) >= CURRENT_DATE - INTERVAL '1 day' THEN COALESCE(MAX(streak_length), 0)
      ELSE 0
    END
  INTO current_streak
  FROM groups
  WHERE latest_date = (SELECT MAX(latest_date) FROM groups);
  
  -- Get longest streak
  WITH consecutive_days AS (
    SELECT 
      date,
      date - (ROW_NUMBER() OVER (ORDER BY date))::INTEGER AS grp
    FROM (
      SELECT DISTINCT DATE_TRUNC('day', created_at)::DATE as date
      FROM user_contributions
      WHERE user_id = user_id_param
    ) dates
  ),
  groups AS (
    SELECT COUNT(*) as streak_length
    FROM consecutive_days
    GROUP BY grp
  )
  SELECT COALESCE(MAX(streak_length), 0)
  INTO longest_streak
  FROM groups;
  
  -- Get flashcard sets count
  SELECT COUNT(*)
  INTO sets_count
  FROM flashcard_sets
  WHERE user_id = user_id_param;
  
  -- Get total cards studied
  SELECT COALESCE(SUM((metadata->>'cards_studied')::INT), 0)
  INTO total_cards_studied
  FROM user_contributions
  WHERE user_id = user_id_param
    AND contribution_type = 'study_completed'
    AND metadata ? 'cards_studied';
  
  -- Get contributions by type
  SELECT JSONB_OBJECT_AGG(contribution_type, total_value)
  INTO contributions_by_type
  FROM (
    SELECT 
      contribution_type,
      SUM(contribution_value) as total_value
    FROM user_contributions
    WHERE user_id = user_id_param
    GROUP BY contribution_type
  ) type_totals;
  
  -- Return all stats as a JSON object
  RETURN JSONB_BUILD_OBJECT(
    'totalContributions', total_contributions,
    'currentStreak', current_streak,
    'longestStreak', longest_streak,
    'setsCount', sets_count,
    'totalCardsStudied', total_cards_studied,
    'contributionsByType', COALESCE(contributions_by_type, '{}'::JSONB)
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to track app opens more efficiently
CREATE OR REPLACE FUNCTION track_app_open(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  today DATE := CURRENT_DATE;
  already_tracked BOOLEAN;
BEGIN
  -- Check if already tracked today
  SELECT EXISTS(
    SELECT 1
    FROM user_contributions
    WHERE user_id = user_id_param
      AND contribution_type = 'app_opened'
      AND DATE(created_at) = today
  ) INTO already_tracked;
  
  -- If not tracked today, insert contribution
  IF NOT already_tracked THEN
    INSERT INTO user_contributions (
      user_id,
      contribution_type,
      contribution_value,
      metadata
    ) VALUES (
      user_id_param,
      'app_opened',
      1,
      JSONB_BUILD_OBJECT('date', today)
    );
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create an index to improve performance of contribution queries
CREATE INDEX IF NOT EXISTS user_contributions_user_id_type_idx 
ON user_contributions(user_id, contribution_type);

CREATE INDEX IF NOT EXISTS user_contributions_created_at_idx 
ON user_contributions(created_at);
