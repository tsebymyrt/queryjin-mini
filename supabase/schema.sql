-- Mini Game Heaven - Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Game logs table
CREATE TABLE IF NOT EXISTS public.game_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT 'anonymous',
  ip_address TEXT NOT NULL DEFAULT 'unknown',
  game_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('enter', 'exit', 'complete')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS game_logs_game_id_idx ON public.game_logs(game_id);
CREATE INDEX IF NOT EXISTS game_logs_action_idx ON public.game_logs(action);
CREATE INDEX IF NOT EXISTS game_logs_created_at_idx ON public.game_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.game_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for logging)
CREATE POLICY "Allow anonymous inserts" ON public.game_logs
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anonymous reads (for play counts on hub page)
CREATE POLICY "Allow anonymous reads" ON public.game_logs
  FOR SELECT TO anon
  USING (true);

-- Helpful view: play counts per game
CREATE OR REPLACE VIEW public.game_play_counts AS
SELECT
  game_id,
  COUNT(*) FILTER (WHERE action = 'enter') AS enter_count,
  COUNT(*) FILTER (WHERE action = 'complete') AS complete_count,
  COUNT(DISTINCT nickname) AS unique_players
FROM public.game_logs
GROUP BY game_id;

-- Mystery game rankings table
CREATE TABLE IF NOT EXISTS public.mystery_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  time_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS mystery_rankings_time_idx ON public.mystery_rankings(time_seconds ASC);
ALTER TABLE public.mystery_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON public.mystery_rankings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous reads" ON public.mystery_rankings FOR SELECT TO anon USING (true);
