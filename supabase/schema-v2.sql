-- supabase/schema-v2.sql
-- Run in Supabase SQL Editor after schema-v1 (existing schema.sql)

CREATE TABLE IF NOT EXISTS public_playlists (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_playlist_id  text UNIQUE NOT NULL,
  owner_id             text NOT NULL,
  owner_display_name   text NOT NULL,
  name                 text NOT NULL,
  cover_url            text,
  track_count          int NOT NULL DEFAULT 0,
  is_active            bool NOT NULL DEFAULT true,
  submitted_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS track_votes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id          uuid NOT NULL REFERENCES public_playlists(id) ON DELETE CASCADE,
  spotify_track_id     text NOT NULL,
  vote                 bool NOT NULL,
  voter_fingerprint    text NOT NULL,
  voted_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, spotify_track_id, voter_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_track_votes_playlist ON track_votes(playlist_id);
CREATE INDEX IF NOT EXISTS idx_public_playlists_owner ON public_playlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_public_playlists_active ON public_playlists(is_active, submitted_at);

-- Partial unique constraint: one active playlist per owner
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_per_owner
  ON public_playlists (owner_id)
  WHERE is_active = true;

CREATE OR REPLACE VIEW playlist_scores AS
SELECT
  playlist_id,
  COUNT(*)                                        AS total_votes,
  ROUND(AVG(vote::int) * 100)::int                AS approval_pct,
  COUNT(DISTINCT voter_fingerprint)               AS unique_voters
FROM track_votes
GROUP BY playlist_id;

-- Row-Level Security
-- public_playlists: anyone can read, service role handles writes (API routes use service role key)
ALTER TABLE public_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_playlists_select" ON public_playlists
  FOR SELECT USING (true);

-- track_votes: anyone can read (for realtime dashboard), service role handles writes
ALTER TABLE track_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "track_votes_select" ON track_votes
  FOR SELECT USING (true);
