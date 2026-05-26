import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { spotifyPlaylistId, name, coverUrl, trackCount, ownerDisplayName } = body as {
    spotifyPlaylistId: string;
    name: string;
    coverUrl: string | null;
    trackCount: number;
    ownerDisplayName: string;
  };

  if (!spotifyPlaylistId || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Deactivate any existing submission from this user
  await supabase
    .from("public_playlists")
    .update({ is_active: false })
    .eq("owner_id", session.userId)
    .eq("is_active", true);

  // Upsert new submission
  const { data, error } = await supabase
    .from("public_playlists")
    .upsert(
      {
        spotify_playlist_id: spotifyPlaylistId,
        owner_id: session.userId,
        owner_display_name: ownerDisplayName,
        name,
        cover_url: coverUrl,
        track_count: trackCount,
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
