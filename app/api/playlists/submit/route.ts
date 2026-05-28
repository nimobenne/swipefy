import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";
import { getPlaylistMetadata, getPlaylistTracks } from "@/lib/spotify";

function extractPlaylistId(input: string): string | null {
  const match = input.match(/playlist\/([A-Za-z0-9]+)/);
  if (match) return match[1];
  if (/^[A-Za-z0-9]{10,30}$/.test(input.trim())) return input.trim();
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { spotifyPlaylistUrl } = body as { spotifyPlaylistUrl: string };

  const playlistId = extractPlaylistId(spotifyPlaylistUrl ?? "");
  if (!playlistId) {
    return NextResponse.json({ error: "Invalid Spotify playlist URL" }, { status: 400 });
  }

  let metadata;
  let tracks;
  try {
    [metadata, tracks] = await Promise.all([
      getPlaylistMetadata(playlistId),
      getPlaylistTracks(playlistId),
    ]);
  } catch (e) {
    console.error("[submit] spotify fetch failed", { playlistId, error: e instanceof Error ? e.message : e });
    return NextResponse.json({ error: "Could not fetch playlist from Spotify. Make sure it's public." }, { status: 400 });
  }

  console.log("[submit] fetched", { playlistId, name: metadata.name, trackCount: metadata.trackCount, tracksLoaded: tracks.length });

  const { error: deactivateError } = await supabase
    .from("public_playlists")
    .update({ is_active: false })
    .eq("owner_id", session.userId)
    .eq("is_active", true);

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("public_playlists")
    .upsert(
      {
        spotify_playlist_id: playlistId,
        owner_id: session.userId,
        owner_display_name: session.user?.name ?? "Anonymous",
        name: metadata.name,
        cover_url: metadata.coverUrl,
        track_count: metadata.trackCount || tracks.length,
        tracks_json: tracks,
        is_active: true,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "spotify_playlist_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ playlist: data });
}
