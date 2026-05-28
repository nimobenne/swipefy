import { NextResponse } from "next/server";

// This endpoint provided user-owned Spotify playlists via user access tokens.
// With the Google OAuth migration, user playlists are fetched client-side via
// the Spotify Web Playback SDK or entered by URL. This route is no longer used.
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is no longer available." },
    { status: 410 }
  );
}
