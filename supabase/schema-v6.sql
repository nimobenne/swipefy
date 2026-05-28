-- Admin Spotify token storage (one row per admin user)
create table if not exists admin_spotify_tokens (
  user_id text primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  updated_at timestamptz default now()
);
