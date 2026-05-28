import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/admin";
import { getAdminAccessToken } from "@/lib/spotify-admin-token";
import { getPlaylistMetadataWithToken, getPlaylistTracksWithToken } from "@/lib/spotify";
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

  let metadata, tracks;
  try {
    metadata = await getPlaylistMetadataWithToken(spotifyPlaylistId, accessToken);
  } catch (e) {
    return NextResponse.json(
      { error: `Could not load playlist: ${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  try {
    tracks = await getPlaylistTracksWithToken(spotifyPlaylistId, accessToken);
  } catch (e) {
    return NextResponse.json(
      { error: `Could not load tracks: ${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }

  if (!tracks.length) {
    return NextResponse.json({ error: "Playlist has no tracks." }, { status: 422 });
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
