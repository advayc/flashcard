-- Create contributions table
CREATE TABLE user_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL,
  contribution_value INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create index for faster queries
CREATE INDEX user_contributions_user_id_idx ON user_contributions(user_id);
CREATE INDEX user_contributions_created_at_idx ON user_contributions(created_at);

-- Create view for aggregated daily contributions
CREATE OR REPLACE VIEW daily_contributions AS
SELECT 
  user_id,
  DATE_TRUNC('day', created_at) AS contribution_date,
  SUM(contribution_value) AS contribution_count
FROM 
  user_contributions
GROUP BY 
  user_id, DATE_TRUNC('day', created_at);
