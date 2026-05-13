# Swipefy

Tinder-style Spotify playlist curator. Swipe right to keep, left to remove tracks. Plays 30-second previews.

## Stack
- Next.js 16 (App Router, Turbopack)
- NextAuth.js v4 (Spotify OAuth)
- Supabase (swipe history)
- Framer Motion (drag animations)
- Tailwind CSS (custom Spotify/Tinder theme)
- Vercel (deploy target)

## Env Vars Required
Copy `.env.example` → `.env.local` and fill in:
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — from Spotify Developer Dashboard
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` (dev) or prod URL
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project

## Spotify App Setup
1. Go to https://developer.spotify.com/dashboard
2. Create an app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Copy Client ID + Secret to `.env.local`

## Supabase Setup
1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Copy URL + keys to `.env.local`

## Dev
```bash
npm run dev
```

## Key Files
- `app/swipe/[playlistId]/page.tsx` — main swipe experience
- `components/SwipeStack.tsx` — drag + swipe logic (Framer Motion)
- `hooks/useSwipeSession.ts` — swipe state, streaks, dopamine
- `hooks/useAudio.ts` — 30-sec preview playback with fade
- `lib/spotify.ts` — Spotify API wrapper
- `lib/auth-options.ts` — NextAuth + token refresh

## Status
MVP complete. Not deployed yet.

---

## Keep This File Updated

At the end of every session, update this file to reflect what changed:
- Current status and completed work
- New decisions, files, or architecture changes
- Remove anything no longer accurate
- Refresh what's next / pending

This file is Claude's primary context for this project. Keep it current.
