-- Create checkins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id TEXT,
  password TEXT NOT NULL,
  hub_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create checkin_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.checkin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkin_id UUID NOT NULL REFERENCES public.checkins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS checkins_user_id_idx ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS checkins_hub_id_idx ON public.checkins(hub_id);
CREATE INDEX IF NOT EXISTS checkins_status_idx ON public.checkins(status);
CREATE INDEX IF NOT EXISTS checkins_timestamp_idx ON public.checkins(timestamp);
CREATE INDEX IF NOT EXISTS checkin_logs_checkin_id_idx ON public.checkin_logs(checkin_id);

-- Enable Row Level Security
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for checkins table
CREATE POLICY "Users can view their own check-ins" 
  ON public.checkins FOR SELECT 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'permissions' = 'admin');

CREATE POLICY "Users can create their own check-ins" 
  ON public.checkins FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update check-ins" 
  ON public.checkins FOR UPDATE 
  USING (auth.jwt() ->> 'permissions' = 'admin');

-- Create policies for checkin_logs table
CREATE POLICY "Users can view logs of their own check-ins" 
  ON public.checkin_logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.checkins 
    WHERE checkins.id = checkin_logs.checkin_id AND checkins.user_id = auth.uid()
  ) OR auth.jwt() ->> 'permissions' = 'admin');

CREATE POLICY "Only admins can create check-in logs" 
  ON public.checkin_logs FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'permissions' = 'admin');
