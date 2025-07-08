-- Database Audit and Cleanup Migration
-- This migration addresses function duplications, adds missing indexes, and improves data integrity

-- Step 1: Clean up duplicate function definitions
-- Drop and recreate the update_updated_at_column function with proper handling
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Add missing performance indexes
-- Index for campaign status filtering (used in dashboard queries)
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Index for session date queries (calendar views)
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_date ON sessions(scheduled_date);

-- Composite index for campaign member queries
CREATE INDEX IF NOT EXISTS idx_campaign_members_composite ON campaign_members(campaign_id, user_id, role);

-- Index for user profile friend code lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_friend_code ON user_profiles(friend_code);

-- Index for connected accounts provider lookups
CREATE INDEX IF NOT EXISTS idx_connected_accounts_provider ON connected_accounts(provider, user_id);

-- Index for friendship status queries
CREATE INDEX IF NOT EXISTS idx_friendships_status_users ON friendships(status, requester_id, addressee_id);

-- Step 3: Add data integrity constraints
-- Validate session duration is reasonable (1 minute to 24 hours)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_session_duration'
    ) THEN
        ALTER TABLE sessions ADD CONSTRAINT valid_session_duration 
            CHECK (duration_minutes > 0 AND duration_minutes <= 1440);
    END IF;
END $$;

-- Validate experience levels are from known set
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_experience_level'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT valid_experience_level 
            CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert'));
    END IF;
END $$;

-- Validate user_ttrpg_systems experience levels
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_system_experience'
    ) THEN
        ALTER TABLE user_ttrpg_systems ADD CONSTRAINT valid_system_experience 
            CHECK (experience_level IN ('never_played', 'beginner', 'familiar', 'experienced', 'expert'));
    END IF;
END $$;

-- Validate friendship status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_friendship_status'
    ) THEN
        ALTER TABLE friendships ADD CONSTRAINT valid_friendship_status 
            CHECK (status IN ('pending', 'accepted', 'declined', 'blocked'));
    END IF;
END $$;

-- Step 4: Add helpful comments for documentation
COMMENT ON TABLE campaigns IS 'D&D campaigns managed by DMs with player participation';
COMMENT ON TABLE sessions IS 'Individual game sessions within campaigns';
COMMENT ON TABLE user_profiles IS 'Extended user information with D&D preferences and social settings';
COMMENT ON TABLE friendships IS 'Friend connections between users with request/accept workflow';
COMMENT ON TABLE connected_accounts IS 'OAuth provider connections for authentication and profile data';

-- Step 5: Refresh materialized views if any exist (none currently, but good practice)
-- Note: No materialized views in current schema, but this is where they would be refreshed

-- Step 6: Update statistics for query planner
ANALYZE campaigns;
ANALYZE sessions;
ANALYZE user_profiles;
ANALYZE friendships;
ANALYZE connected_accounts;
ANALYZE campaign_members;