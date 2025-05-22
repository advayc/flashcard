-- Create daily_contributions view if it doesn't exist
CREATE OR REPLACE VIEW daily_contributions AS
SELECT 
  user_id,
  DATE_TRUNC('day', created_at) AS contribution_date,
  SUM(contribution_value) AS contribution_count
FROM 
  user_contributions
GROUP BY 
  user_id, DATE_TRUNC('day', created_at);
