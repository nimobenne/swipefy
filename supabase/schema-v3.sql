-- V3: store tracks at submission time so we don't need Spotify API at vote time
ALTER TABLE public_playlists ADD COLUMN IF NOT EXISTS tracks_json jsonb;
