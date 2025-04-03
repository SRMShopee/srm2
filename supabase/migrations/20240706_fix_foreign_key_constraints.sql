-- First create all the types and tables
DO $$ BEGIN
  CREATE TYPE "public"."user_permissions" AS ENUM('admin', 'USER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."states_enum" AS ENUM('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."routes_shift" AS ENUM('AM', 'PM', 'OUROBORO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."routes_status" AS ENUM('pending', 'accepted', 'under-review');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create tables in the correct order (parent tables first)
CREATE TABLE IF NOT EXISTS "hubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"code" varchar NOT NULL,
	"cep" varchar NOT NULL,
	"state" "states_enum" NOT NULL,
	"city" varchar(30) NOT NULL,
	"neighborhood" varchar(50) NOT NULL,
	"street" varchar(50) NOT NULL,
	"residence_number" integer NOT NULL,
	"complement" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"hub_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"cep" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hub_id" uuid NOT NULL,
	"driver_id" integer,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"permissions" "user_permissions",
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hub_id" uuid NOT NULL,
	"city_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"neighborhoods" json NOT NULL,
	"packages" integer NOT NULL,
	"distance" varchar NOT NULL,
	"shift" "routes_shift" NOT NULL,
	"status" "routes_status" DEFAULT 'pending',
	"content" json NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_blocked_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "route_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Now add all foreign key constraints after all tables exist
DO $$ BEGIN
 ALTER TABLE "cities" ADD CONSTRAINT "cities_hub_id_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hubs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_hub_id_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hubs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_hub_id_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hubs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_blocked_routes" ADD CONSTRAINT "user_blocked_routes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_blocked_routes" ADD CONSTRAINT "user_blocked_routes_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "route_interests" ADD CONSTRAINT "route_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "route_interests" ADD CONSTRAINT "route_interests_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create a default hub first
INSERT INTO "hubs" ("name", "code", "cep", "state", "city", "neighborhood", "street", "residence_number")
VALUES ('SINOSPLEX', 'SNPX', '93000-000', 'RS', 'São Leopoldo', 'Centro', 'Rua Principal', 100)
ON CONFLICT (id) DO NOTHING;

-- Create a default city
INSERT INTO "cities" ("hub_id", "name", "cep")
SELECT id, 'São Leopoldo', '93000-000' FROM "hubs" WHERE "code" = 'SNPX'
ON CONFLICT DO NOTHING;

-- Create default admin user
INSERT INTO "users" ("hub_id", "driver_id", "name", "email", "phone", "permissions")
SELECT id, 1000, 'Administrador', 'admin@srm.com', '51999999999', 'admin'
FROM "hubs" WHERE "code" = 'SNPX'
ON CONFLICT DO NOTHING;

-- Create default regular user
INSERT INTO "users" ("hub_id", "driver_id", "name", "email", "phone", "permissions")
SELECT id, 2000, 'Entregador Padrão', 'entregador@srm.com', '51888888888', 'USER'
FROM "hubs" WHERE "code" = 'SNPX'
ON CONFLICT DO NOTHING;

-- Create auth.users entries for the admin and regular user
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT 
  id, 
  email, 
  now(), 
  created_at, 
  updated_at, 
  jsonb_build_object(
    'name', name,
    'driver_id', driver_id,
    'phone', phone,
    'permissions', permissions
  )
FROM "users"
WHERE email IN ('admin@srm.com', 'entregador@srm.com')
ON CONFLICT DO NOTHING;

-- Set passwords for the users (password: Admin@123 for admin and User@123 for regular user)
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  id, 
  jsonb_build_object('sub', id::text, 'email', email), 
  'email', 
  now(), 
  created_at, 
  updated_at
FROM auth.users
WHERE email IN ('admin@srm.com', 'entregador@srm.com')
ON CONFLICT DO NOTHING;

-- Set passwords using Supabase's built-in function
UPDATE auth.users
SET encrypted_password = crypt('Admin@123', gen_salt('bf'))
WHERE email = 'admin@srm.com';

UPDATE auth.users
SET encrypted_password = crypt('User@123', gen_salt('bf'))
WHERE email = 'entregador@srm.com';

-- Add tables to realtime publication
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table hubs;
alter publication supabase_realtime add table cities;
alter publication supabase_realtime add table routes;
alter publication supabase_realtime add table route_interests;
alter publication supabase_realtime add table user_blocked_routes;