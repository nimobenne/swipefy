import { NextResponse } from "next/server";

export async function DELETE() {
  // Track removal via Spotify user tokens is no longer supported.
  // The /swipe flow now uses client credentials (read-only) and does not modify playlists.
  return NextResponse.json(
    { error: "Track removal is not supported in this version." },
    { status: 410 }
  );
}
