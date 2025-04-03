-- Create types
CREATE TYPE user_permission AS ENUM ('admin', 'driver');
CREATE TYPE state AS ENUM ('active', 'inactive', 'blocked');
CREATE TYPE route_shift AS ENUM ('AM', 'PM', 'OUROBOROS');
CREATE TYPE route_status AS ENUM ('PENDENTE', 'ATRIBUÍDA', 'CONCLUÍDA');

-- Create hubs table first
CREATE TABLE IF NOT EXISTS hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  driver_id INTEGER UNIQUE,
  phone TEXT,
  role user_permission DEFAULT 'driver' NOT NULL,
  state state DEFAULT 'active' NOT NULL,
  hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  shift route_shift NOT NULL,
  status route_status DEFAULT 'PENDENTE' NOT NULL,
  packages INTEGER DEFAULT 0 NOT NULL,
  distance TEXT,
  estimated_time TEXT,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create route_interests table
CREATE TABLE IF NOT EXISTS route_interests (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, city_id)
);

-- Create user_blocked_routes table
CREATE TABLE IF NOT EXISTS user_blocked_routes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, route_id)
);

-- Enable row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocked_routes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE hubs;
ALTER PUBLICATION supabase_realtime ADD TABLE cities;
ALTER PUBLICATION supabase_realtime ADD TABLE routes;
ALTER PUBLICATION supabase_realtime ADD TABLE route_interests;
ALTER PUBLICATION supabase_realtime ADD TABLE user_blocked_routes;
