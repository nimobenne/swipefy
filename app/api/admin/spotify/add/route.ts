import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/admin";
import { getAdminAccessToken } from "@/lib/spotify-admin-token";
import {
  getPlaylistMetadataWithToken,
  getPlaylistTracksWithToken,
  getPlaylistMetadata,
  getPlaylistTracks,
} from "@/lib/spotify";
import { getSupabase } from "@/lib/supabase";
import { currentWeekStart } from "@/lib/weekly";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { spotifyPlaylistId } = await req.json();
  if (!spotifyPlaylistId || typeof spotifyPlaylistId !== "string") {
    return NextResponse.json({ error: "Missing spotifyPlaylistId" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getAdminAccessToken(session.userId);
  } catch {
    return NextResponse.json({ error: "no_spotify_token" }, { status: 401 });
  }

  // Try user token first (needed for private playlists).
  // Fall back to client credentials for public playlists not owned by the admin
  // — Spotify dev mode restricts track data for non-owned playlists via user tokens.
  let metadata, tracks;
  try {
    metadata = await getPlaylistMetadataWithToken(spotifyPlaylistId, accessToken);
    tracks = await getPlaylistTracksWithToken(spotifyPlaylistId, accessToken);
  } catch (e) {
    return NextResponse.json(
      { error: `Could not load playlist: ${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }

  if (!tracks.length) {
    // User token returned 0 tracks (Spotify dev mode restricts non-owned playlists).
    // Fall back to client credentials which work for public playlists.
    try {
      metadata = await getPlaylistMetadata(spotifyPlaylistId);
      tracks = await getPlaylistTracks(spotifyPlaylistId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("404")) {
        return NextResponse.json(
          { error: "This playlist is private. Make it public on Spotify to add it, or apply for a Spotify Quota Extension to enable private playlist access." },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: `Could not load playlist tracks: ${msg}` },
        { status: 500 }
      );
    }
  }

  if (!tracks.length) {
    return NextResponse.json(
      { error: "Playlist has no playable tracks. Make sure it is public and not empty." },
      { status: 422 }
    );
  }

  const { error } = await getSupabase()
    .from("public_playlists")
    .upsert(
      {
        spotify_playlist_id: spotifyPlaylistId,
        owner_id: session.userId,
        owner_display_name: metadata.ownerDisplayName,
        name: metadata.name,
        cover_url: metadata.coverUrl,
        track_count: tracks.length,
        tracks_json: tracks,
        is_active: true,
        week_of: currentWeekStart(),
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "spotify_playlist_id" }
    );

  if (error) {
    return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, name: metadata.name, trackCount: tracks.length });
}
