-- Create hub_location_history table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hub_location_history') THEN
        CREATE TABLE public.hub_location_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            hub_id VARCHAR(255) NOT NULL,
            user_id UUID NOT NULL,
            latitude DECIMAL(10, 6) NOT NULL,
            longitude DECIMAL(10, 6) NOT NULL,
            radius INTEGER NOT NULL,
            action VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Add indexes for performance
        CREATE INDEX idx_hub_location_history_hub_id ON public.hub_location_history(hub_id);
        CREATE INDEX idx_hub_location_history_user_id ON public.hub_location_history(user_id);
        CREATE INDEX idx_hub_location_history_created_at ON public.hub_location_history(created_at);

        RAISE NOTICE 'Created hub_location_history table';
    ELSE
        RAISE NOTICE 'hub_location_history table already exists';
    END IF;
END
$$;