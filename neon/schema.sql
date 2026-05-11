-- JP Fitness Studios - Neon Database Schema (Consolidated)
-- This schema is optimized for Neon Postgres and replicates the core Supabase structure.

-- 1. Base Extensions & Types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('member', 'coach', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles (Main Identity Hub)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  gender TEXT,
  dob DATE,
  height_cm NUMERIC,
  goal TEXT DEFAULT 'weight_loss',
  target_weight_kg NUMERIC,
  daily_calorie_goal INT DEFAULT 2000,
  daily_water_goal_ml INT DEFAULT 2500,
  daily_step_goal INT DEFAULT 10000,
  sleep_goal_hr NUMERIC DEFAULT 8,
  loyalty_points INT DEFAULT 0,
  coach_phone TEXT DEFAULT '+919999999999',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Packages (Subscription & Billing)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Attendance & Logging
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 6. Loyalty & Rewards
CREATE TABLE IF NOT EXISTS loyalty_point_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_change INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  points_cost INT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Audit & Security
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Functions (Ported from Supabase)
CREATE OR REPLACE FUNCTION set_user_role(_target UUID, _role app_role)
RETURNS void AS $$
BEGIN
  INSERT INTO user_roles (user_id, role) 
  VALUES (_target, _role) 
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
