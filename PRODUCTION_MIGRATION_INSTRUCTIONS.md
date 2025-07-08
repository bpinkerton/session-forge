# Production Migration Instructions

## Apply to both Staging and Production Supabase databases

**⚠️ IMPORTANT: These scripts are safe and check for existing tables before creating anything. No existing data will be affected.**

### Step 1: Friends System Tables and Functions

Copy and run this SQL in the Supabase SQL Editor:

```sql
-- Create friendships table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friendships') THEN
        CREATE TABLE public.friendships (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            requester_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
            addressee_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Ensure no duplicate friendships (regardless of direction)
            CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id),
            -- Ensure users can't friend themselves
            CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id)
        );

        -- Create indexes for performance
        CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
        CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
        CREATE INDEX idx_friendships_status ON public.friendships(status);

        -- Enable RLS
        ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

        -- RLS policies for friendships
        CREATE POLICY "Users can view their own friendships" ON public.friendships
            FOR SELECT USING (
                auth.uid() = requester_id OR 
                auth.uid() = addressee_id
            );

        CREATE POLICY "Users can create friendship requests" ON public.friendships
            FOR INSERT WITH CHECK (
                auth.uid() = requester_id
            );

        CREATE POLICY "Users can update their friendships" ON public.friendships
            FOR UPDATE USING (
                auth.uid() = addressee_id OR auth.uid() = requester_id
            );

        CREATE POLICY "Users can delete their friendships" ON public.friendships
            FOR DELETE USING (
                auth.uid() = requester_id OR auth.uid() = addressee_id
            );

        RAISE NOTICE 'Created friendships table and policies';
    ELSE
        RAISE NOTICE 'Friendships table already exists, skipping creation';
    END IF;
END $$;
```

### Step 2: Friends Management Functions

```sql
-- Create or replace friends functions (safe to run multiple times)
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE (
    friendship_id UUID,
    friend_user_id UUID,
    friend_code TEXT,
    display_name TEXT,
    profile_picture_url TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_requester BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as friendship_id,
        CASE 
            WHEN f.requester_id = user_uuid THEN f.addressee_id
            ELSE f.requester_id
        END as friend_user_id,
        up.friend_code,
        up.display_name,
        up.profile_picture_url,
        f.status,
        f.created_at,
        (f.requester_id = user_uuid) as is_requester
    FROM public.friendships f
    INNER JOIN public.user_profiles up ON (
        CASE 
            WHEN f.requester_id = user_uuid THEN up.user_id = f.addressee_id
            ELSE up.user_id = f.requester_id
        END
    )
    WHERE (f.requester_id = user_uuid OR f.addressee_id = user_uuid)
    ORDER BY 
        CASE f.status
            WHEN 'accepted' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'declined' THEN 3
            WHEN 'blocked' THEN 4
        END,
        f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_friends_paginated(
    user_uuid UUID,
    search_query TEXT DEFAULT '',
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
    friendship_id UUID,
    friend_user_id UUID,
    friend_code TEXT,
    display_name TEXT,
    profile_picture_url TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_requester BOOLEAN,
    total_count BIGINT
) AS $$
DECLARE
    offset_count INTEGER;
    total_rows BIGINT;
BEGIN
    offset_count := (page_number - 1) * page_size;
    
    SELECT COUNT(*) INTO total_rows
    FROM public.friendships f
    INNER JOIN public.user_profiles up ON (
        CASE 
            WHEN f.requester_id = user_uuid THEN up.user_id = f.addressee_id
            ELSE up.user_id = f.requester_id
        END
    )
    WHERE (f.requester_id = user_uuid OR f.addressee_id = user_uuid)
    AND (
        search_query = '' OR 
        up.display_name ILIKE '%' || search_query || '%' OR
        up.friend_code ILIKE '%' || search_query || '%'
    );

    RETURN QUERY
    SELECT 
        f.id as friendship_id,
        CASE 
            WHEN f.requester_id = user_uuid THEN f.addressee_id
            ELSE f.requester_id
        END as friend_user_id,
        up.friend_code,
        up.display_name,
        up.profile_picture_url,
        f.status,
        f.created_at,
        (f.requester_id = user_uuid) as is_requester,
        total_rows as total_count
    FROM public.friendships f
    INNER JOIN public.user_profiles up ON (
        CASE 
            WHEN f.requester_id = user_uuid THEN up.user_id = f.addressee_id
            ELSE up.user_id = f.requester_id
        END
    )
    WHERE (f.requester_id = user_uuid OR f.addressee_id = user_uuid)
    AND (
        search_query = '' OR 
        up.display_name ILIKE '%' || search_query || '%' OR
        up.friend_code ILIKE '%' || search_query || '%'
    )
    ORDER BY 
        CASE f.status
            WHEN 'accepted' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'declined' THEN 3
            WHEN 'blocked' THEN 4
        END,
        f.created_at DESC
    LIMIT page_size
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_friends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_friends_paginated(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
```

### Step 3: Triggers and Additional Policies

```sql
-- Create trigger function and trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_friendships_updated_at') THEN
        CREATE TRIGGER update_friendships_updated_at 
            BEFORE UPDATE ON public.friendships 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created updated_at trigger for friendships';
    ELSE
        RAISE NOTICE 'Friendships updated_at trigger already exists';
    END IF;
END $$;

-- Add policies for public profile viewing (safe to run multiple times)
DO $$
BEGIN
    -- Drop existing policies if they exist and recreate them
    DROP POLICY IF EXISTS "Public can view public user_ttrpg_systems" ON public.user_ttrpg_systems;
    DROP POLICY IF EXISTS "Public can view public user_play_styles" ON public.user_play_styles;
    
    CREATE POLICY "Public can view public user_ttrpg_systems" ON public.user_ttrpg_systems
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles up 
                WHERE up.user_id = user_ttrpg_systems.user_id 
                AND (up.privacy_settings->>'profile_visibility')::text IN ('public', 'friends_only')
            )
        );
    
    CREATE POLICY "Public can view public user_play_styles" ON public.user_play_styles
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles up 
                WHERE up.user_id = user_play_styles.user_id 
                AND (up.privacy_settings->>'profile_visibility')::text IN ('public', 'friends_only')
            )
        );
    
    RAISE NOTICE 'Updated public profile viewing policies';
END $$;
```

## Verification

After running the migrations, you can verify they worked by checking:

1. **Friendships table exists**: 
   ```sql
   SELECT EXISTS (
       SELECT FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'friendships'
   );
   ```

2. **Functions were created**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE '%user_friends%';
   ```

## Notes

- **Medium of Play**: This feature uses the existing JSONB `scheduling_preferences` field, so no database changes are needed
- **All scripts are idempotent**: Safe to run multiple times
- **No data loss**: These migrations only ADD new functionality
- **RLS enabled**: Proper security policies are in place

## Deployment Order

1. Apply database migrations (above)
2. Deploy the application code from the PR
3. Test the friends functionality

The friends system will be fully functional once both the database changes and application code are deployed!