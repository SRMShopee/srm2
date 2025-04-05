-- Create checkins table
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id TEXT,
  password TEXT NOT NULL,
  hub_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies for checkins table
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own check-ins
CREATE POLICY "Users can view their own check-ins" 
  ON public.checkins 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can create their own check-ins
CREATE POLICY "Users can create their own check-ins" 
  ON public.checkins 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all check-ins
CREATE POLICY "Admins can view all check-ins" 
  ON public.checkins 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND permissions = 'admin'
  ));

-- Policy: Admins can update check-ins
CREATE POLICY "Admins can update check-ins" 
  ON public.checkins 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND permissions = 'admin'
  ));

-- Create checkin_logs table for tracking status changes
CREATE TABLE IF NOT EXISTS public.checkin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkin_id UUID NOT NULL REFERENCES public.checkins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for checkin_logs table
ALTER TABLE public.checkin_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view logs for their own check-ins
CREATE POLICY "Users can view logs for their own check-ins" 
  ON public.checkin_logs 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.checkins 
    WHERE id = checkin_id AND user_id = auth.uid()
  ));

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view all logs" 
  ON public.checkin_logs 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND permissions = 'admin'
  ));

-- Policy: Admins can create logs
CREATE POLICY "Admins can create logs" 
  ON public.checkin_logs 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND permissions = 'admin'
  ));

-- Create index for faster queries
CREATE INDEX checkins_user_id_idx ON public.checkins(user_id);
CREATE INDEX checkins_hub_id_idx ON public.checkins(hub_id);
CREATE INDEX checkins_status_idx ON public.checkins(status);
CREATE INDEX checkins_timestamp_idx ON public.checkins(timestamp);
