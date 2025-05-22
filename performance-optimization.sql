-- Create materialized view for faster contribution data access
CREATE MATERIALIZED VIEW IF NOT EXISTS user_contribution_summary AS
SELECT 
  user_id,
  DATE_TRUNC('day', created_at)::DATE as contribution_date,
  SUM(contribution_value) as contribution_count,
  COUNT(DISTINCT contribution_type) as unique_contribution_types,
  JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'type', contribution_type,
      'value', contribution_value,
      'time', TO_CHAR(created_at, 'HH24:MI:SS'),
      'metadata', metadata
    )
  ) as details
FROM user_contributions
GROUP BY user_id, DATE_TRUNC('day', created_at)::DATE;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS user_contribution_summary_user_id_idx 
ON user_contribution_summary(user_id);

CREATE INDEX IF NOT EXISTS user_contribution_summary_date_idx 
ON user_contribution_summary(contribution_date);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_contribution_summary()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_contribution_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh the materialized view when contributions change
DROP TRIGGER IF EXISTS refresh_contribution_summary_trigger ON user_contributions;
CREATE TRIGGER refresh_contribution_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_contributions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_contribution_summary();

-- Create function to get user contributions from the materialized view
CREATE OR REPLACE FUNCTION get_user_contributions_optimized(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT 
    JSONB_OBJECT_AGG(
      TO_CHAR(contribution_date, 'YYYY-MM-DD'), 
      JSONB_BUILD_OBJECT('count', contribution_count, 'details', details)
    )
  INTO result
  FROM user_contribution_summary
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Create index for faster flashcard retrieval
CREATE INDEX IF NOT EXISTS flashcards_set_id_idx ON flashcards(set_id);

-- Create index for faster profile retrieval
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(id);

-- Add caching hints to frequently accessed tables
ALTER TABLE flashcard_sets SET (fillfactor = 80);
ALTER TABLE flashcards SET (fillfactor = 80);
ALTER TABLE user_contributions SET (fillfactor = 80);

-- Create a function to clean up old contributions data
CREATE OR REPLACE FUNCTION cleanup_old_contributions()
RETURNS void AS $$
BEGIN
  -- Delete contributions older than 2 years
  DELETE FROM user_contributions
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Refresh the materialized view after cleanup
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_contribution_summary;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the cleanup function monthly
SELECT cron.schedule('0 0 1 * *', $$SELECT cleanup_old_contributions()$$);

-- Optimize query performance with vacuum analyze
VACUUM ANALYZE user_contributions;
VACUUM ANALYZE flashcard_sets;
VACUUM ANALYZE flashcards;
VACUUM ANALYZE profiles;
