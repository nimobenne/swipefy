import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/admin";
import { getPlaylistTracks, getPlaylistMetadata } from "@/lib/spotify";
import { supabase } from "@/lib/supabase";
import { currentWeekStart } from "@/lib/weekly";

function extractPlaylistId(input: string): string | null {
  let decoded = input;
  try { decoded = decodeURIComponent(input); } catch { /* use as-is */ }
  const clean = decoded.split("?")[0].split("#")[0].trim();
  const urlMatch = clean.match(/playlist[/:]([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[A-Za-z0-9]{10,40}$/.test(clean)) return clean;
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { playlistUrl } = await req.json();
  const playlistId = extractPlaylistId(playlistUrl ?? "");
  if (!playlistId) {
    return NextResponse.json({ error: "Invalid playlist URL" }, { status: 400 });
  }

  let metadata, tracks;
  try {
    metadata = await getPlaylistMetadata(playlistId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Could not load playlist: ${msg}` }, { status: 500 });
  }
  try {
    tracks = await getPlaylistTracks(playlistId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Could not load tracks: ${msg}` }, { status: 500 });
  }

  if (!tracks.length) {
    return NextResponse.json({ error: `Spotify returned 0 tracks for this playlist. Make sure it is public and not empty.` }, { status: 422 });
  }

  await supabase.from("public_playlists").update({ is_active: false }).eq("owner_id", session.userId).eq("is_active", true);

  const { error } = await supabase.from("public_playlists").upsert(
    {
      spotify_playlist_id: playlistId,
      owner_id: session.userId,
      owner_display_name: metadata.ownerDisplayName,
      name: metadata.name,
      cover_url: metadata.coverUrl,
      track_count: tracks.length || metadata.trackCount,
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

  return NextResponse.json({ success: true, trackCount: tracks.length });
}
