-- Swipefy schema
-- Run this in your Supabase SQL editor

create table if not exists swipe_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  playlist_id text not null,
  playlist_name text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists swipes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references swipe_sessions(id) on delete cascade,
  track_id text not null,
  track_name text,
  artist_name text,
  direction text not null check (direction in ('keep', 'remove')),
  created_at timestamptz default now()
);

-- Indexes
create index if not exists swipes_session_id_idx on swipes(session_id);
create index if not exists swipes_track_id_idx on swipes(track_id);
create index if not exists swipe_sessions_user_id_idx on swipe_sessions(user_id);

-- RLS (optional — disable if using service role key only)
alter table swipe_sessions enable row level security;
alter table swipes enable row level security;
