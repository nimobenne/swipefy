-- supabase/schema-v4.sql
-- Run in Supabase SQL Editor after schema-v3.sql

-- Tag each playlist with the Monday-start week it belongs to
ALTER TABLE public_playlists ADD COLUMN IF NOT EXISTS week_of date;

-- One random 15-track sample per playlist per week (same for all voters)
CREATE TABLE IF NOT EXISTS weekly_samples (
  playlist_id  uuid NOT NULL REFERENCES public_playlists(id) ON DELETE CASCADE,
  week_of      date NOT NULL,
  sampled_tracks jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, week_of)
);

-- One voting session per user per calendar day (one playlist per day)
CREATE TABLE IF NOT EXISTS daily_sessions (
  user_id       text NOT NULL,
  session_date  date NOT NULL DEFAULT CURRENT_DATE,
  playlist_id   uuid REFERENCES public_playlists(id) ON DELETE SET NULL,
  completed_at  timestamptz,
  PRIMARY KEY (user_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_public_playlists_week ON public_playlists(week_of, is_active);
CREATE INDEX IF NOT EXISTS idx_weekly_samples_week ON weekly_samples(week_of);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_user ON daily_sessions(user_id, session_date);

ALTER TABLE weekly_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly_samples_select" ON weekly_samples FOR SELECT USING (true);

ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_sessions_select" ON daily_sessions FOR SELECT USING (true);
