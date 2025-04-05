-- Create checkins table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkins') THEN
        CREATE TABLE public.checkins (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            hub_id UUID NOT NULL,
            latitude DECIMAL(10, 6) NOT NULL,
            longitude DECIMAL(10, 6) NOT NULL,
            status VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Add indexes for performance
        CREATE INDEX idx_checkins_user_id ON public.checkins(user_id);
        CREATE INDEX idx_checkins_hub_id ON public.checkins(hub_id);
        CREATE INDEX idx_checkins_created_at ON public.checkins(created_at);

        -- Add RLS policies
        ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

        -- Policy for users to see their own check-ins
        CREATE POLICY "Users can view their own check-ins"
            ON public.checkins
            FOR SELECT
            USING (auth.uid() = user_id);

        -- Policy for users to create their own check-ins
        CREATE POLICY "Users can create their own check-ins"
            ON public.checkins
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        -- Policy for users to update their own check-ins
        CREATE POLICY "Users can update their own check-ins"
            ON public.checkins
            FOR UPDATE
            USING (auth.uid() = user_id);

        -- Policy for admins to view all check-ins
        CREATE POLICY "Admins can view all check-ins"
            ON public.checkins
            FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid()
                AND permissions = 'admin'
            ));

        RAISE NOTICE 'Created checkins table';
    ELSE
        RAISE NOTICE 'checkins table already exists';
    END IF;
END
$$;