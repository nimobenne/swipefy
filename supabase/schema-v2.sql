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

CREATE OR REPLACE VIEW playlist_scores AS
SELECT
  playlist_id,
  COUNT(*)                                        AS total_votes,
  ROUND(AVG(vote::int) * 100)::int                AS approval_pct,
  COUNT(DISTINCT voter_fingerprint)               AS unique_voters
FROM track_votes
GROUP BY playlist_id;
