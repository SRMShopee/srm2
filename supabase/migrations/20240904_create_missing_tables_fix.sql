CREATE TABLE IF NOT EXISTS public.checkins (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), user_id uuid NOT NULL, driver_id text, password text NOT NULL, hub_id text NOT NULL, timestamp timestamptz NOT NULL, status text DEFAULT "pending", location jsonb, updated_at timestamptz, updated_by uuid, created_at timestamptz DEFAULT now()); CREATE TABLE IF NOT EXISTS public.hub_location_history (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), hub_id text NOT NULL, user_id uuid NOT NULL, latitude float NOT NULL, longitude float NOT NULL, radius integer NOT NULL, action text, created_at timestamptz DEFAULT now());
