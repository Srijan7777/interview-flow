-- Run in Supabase SQL Editor when ready to persist users
-- https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  password_hash TEXT,                 -- nullable: OAuth-only users have no local password
  provider TEXT DEFAULT 'credentials',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- If you already created the users table on an older schema, run this once:
--   ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anon key to insert/upsert (for credentials provider)
CREATE POLICY "Allow upsert from auth flow" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update from auth flow" ON public.users
  FOR UPDATE USING (true);

CREATE POLICY "Allow read own row" ON public.users
  FOR SELECT USING (true);

-- Optional: sessions table for tracking interview sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
  type TEXT NOT NULL,
  experience TEXT,
  difficulty TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  data JSONB
);

CREATE INDEX IF NOT EXISTS sessions_user_email_idx ON public.sessions(user_email);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions" ON public.sessions
  FOR ALL USING (true);
