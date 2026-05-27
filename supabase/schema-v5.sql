-- supabase/schema-v5.sql
-- Run in Supabase SQL Editor after schema-v4.sql

CREATE TABLE IF NOT EXISTS nominations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_url     text NOT NULL,
  pitch           text NOT NULL,
  submitted_by    text NOT NULL,
  submitted_name  text NOT NULL,
  week_of         date NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nominations_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS nomination_votes (
  nomination_id  uuid NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
  user_id        text NOT NULL,
  voted_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (nomination_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_nominations_week ON nominations(week_of, status);
CREATE INDEX IF NOT EXISTS idx_nomination_votes_nom ON nomination_votes(nomination_id);

ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nominations_select" ON nominations FOR SELECT USING (true);

ALTER TABLE nomination_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nomination_votes_select" ON nomination_votes FOR SELECT USING (true);
