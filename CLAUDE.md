# Swipefy

Social gamified Spotify playlist competition platform. Users submit playlists to a public pool, strangers swipe individual tracks (30-sec previews) and vote yes/no. Playlists earn a live approval % score. Positioning: "the human-curation layer Spotify refuses to build."

## Stack
- Next.js 16 (App Router, Turbopack)
- NextAuth.js v4 (Google OAuth for login)
- Supabase (postgres + realtime subscriptions)
- Framer Motion (swipe animations + dopamine overlays)
- Tailwind CSS (custom Spotify/Tinder theme)
- Vercel (deploy target)

## Routes
- `/discover` — daily game: 15 tracks/day, 5s each, one playlist per day, weekly pool
- `/leaderboard` — weekly rankings, 50-vote threshold, 80% approval → Spotify link unlock
- `/nominations` — browse + upvote community playlist nominations for next week
- `/nominate` — submit a playlist nomination (1 per user per week, 120-char pitch)
- `/admin` — admin review panel (approve/reject nominations, gated by ADMIN_USER_ID env var)
- `/submit` — admin playlist submission (Spotify OAuth, stores tracks in Supabase)
- `/dashboard` — creator stats: live approval %, per-track breakdown, Supabase Realtime
- `/library` — personal playlist picker
- `/swipe/[playlistId]` — personal curation swipe (original feature)

## Env Vars Required
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — from Spotify Developer Dashboard
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console (OAuth 2.0)
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` (dev) or prod URL
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project
- `ADMIN_USER_ID` — your Google userId (from NextAuth session.userId). Gates `/admin` and playlist submission.

## Supabase Setup
1. Create a Supabase project
2. Run schema files in order: `schema.sql` → `schema-v2.sql` → `schema-v4.sql` → `schema-v5.sql`
3. Enable Realtime on `track_votes` table in Supabase Dashboard
4. Copy URL + keys to `.env.local`

## Dev
```bash
npm run dev
```

## Key Files
- `app/discover/page.tsx` — daily game (main experience), fetches /api/daily
- `app/leaderboard/page.tsx` — weekly leaderboard with 80% Spotify unlock
- `app/nominations/page.tsx` — browse + upvote nominations
- `app/nominate/page.tsx` — submit nomination form
- `app/admin/page.tsx` — admin nomination review panel
- `lib/weekly.ts` — currentWeekStart() + sampleTracks()
- `lib/admin.ts` — isAdmin(userId) checks ADMIN_USER_ID env var
- `app/api/daily/route.ts` — GET: today's playlist + 15 sampled tracks
- `app/api/daily/complete/route.ts` — POST: mark daily session complete
- `app/api/leaderboard/route.ts` — GET: weekly rankings with vote counts
- `app/api/nominations/route.ts` — GET/POST nominations
- `app/api/nominations/[id]/vote/route.ts` — POST: toggle upvote
- `app/api/admin/nominations/route.ts` — GET all (admin only)
- `app/api/admin/nominations/[id]/route.ts` — PATCH status (admin only)
- `app/api/votes/route.ts` — POST: record a track vote
- `supabase/schema-v2.sql` — public_playlists, track_votes, playlist_scores view
- `supabase/schema-v4.sql` — weekly_samples, daily_sessions, week_of on playlists
- `supabase/schema-v5.sql` — nominations, nomination_votes

## Auth Architecture
- **Voters**: Google OAuth only (unlimited users)
- **Submitters**: Google login + one-time Spotify OAuth at submission to fetch tracks. Tracks stored in `public_playlists.tracks_json` (Supabase JSONB). After that, no Spotify needed.
- Spotify dev mode limit (25 users) only affects submitters, not voters.
- To scale submitters beyond 25: apply for Spotify Quota Extension at developer.spotify.com

## Custom Spotify OAuth Flow (submission only)
1. User pastes Spotify playlist URL on `/submit`
2. `GET /api/spotify-auth` — signs state with HMAC-SHA256(NEXTAUTH_SECRET), redirects to Spotify
3. `GET /api/spotify-callback` — verifies state, exchanges code, fetches tracks+metadata, stores to Supabase, redirects to `/dashboard`

## Status
V4 deployed to https://swipefy-psi.vercel.app (2026-05-27)
- Daily game mechanic: 15 tracks/day, 5s each, weekly pool, done screen with CTAs
- Weekly leaderboard: 50-vote threshold, 80% → Spotify link unlock
- Nominations system: submit, upvote, admin approve/reject
- Admin panel: gated by ADMIN_USER_ID env var
- Google OAuth login (NextAuth), custom Spotify OAuth for submission (admin only)
- Admin Spotify browser: connect Spotify once on /admin, browse full library, add multiple playlists to pool (2026-05-28)
- Voter privacy: playlist name/owner hidden from discover page and score reveal — voters see track/album info only

## New Files (2026-05-28)
- `lib/spotify-admin-token.ts` — store/refresh/delete admin Spotify tokens in Supabase
- `app/api/admin/spotify/auth/route.ts` — initiate admin Spotify OAuth
- `app/api/admin/spotify/callback/route.ts` — exchange code, store tokens
- `app/api/admin/spotify/playlists/route.ts` — fetch admin's Spotify library
- `app/api/admin/spotify/add/route.ts` — add playlist to pool (no deactivation of others)
- `app/api/admin/spotify/disconnect/route.ts` — delete stored token
- `app/api/admin/pool/route.ts` — GET active pool playlists
- `app/api/admin/pool/[id]/route.ts` — DELETE (deactivate) a pool playlist
- `supabase/schema-v6.sql` — admin_spotify_tokens table

## Pending (action required)
1. **Add ADMIN_USER_ID to Vercel env vars** — your Google userId. Without this, /admin returns 403.
2. Run `supabase/schema-v5.sql` in Supabase SQL Editor (nominations tables)
3. **Run `supabase/schema-v6.sql`** in Supabase SQL Editor (admin_spotify_tokens table — required for new Spotify browser)
4. **Add redirect URI to Spotify Dashboard**: `https://swipefy-psi.vercel.app/api/admin/spotify/callback` (and `http://localhost:3000/api/admin/spotify/callback` for dev)
5. Rotate Google OAuth credentials (were shared in an earlier session — regenerate in Google Cloud Console)
6. Apply for Spotify Quota Extension when ready to open submissions beyond admin: https://developer.spotify.com/documentation/web-api/concepts/quota-modes

---

## Keep This File Updated

At the end of every session, update this file to reflect what changed:
- Current status and completed work
- New decisions, files, or architecture changes
- Remove anything no longer accurate
- Refresh what's next / pending

This file is Claude's primary context for this project. Keep it current.
