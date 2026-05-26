import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase, makeVoterFingerprint } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { playlistId, spotifyTrackId, vote } = body as {
    playlistId: string;
    spotifyTrackId: string;
    vote: boolean;
  };

  if (!playlistId || !spotifyTrackId || typeof vote !== "boolean") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const voterFingerprint = makeVoterFingerprint(session.userId);

  const { error } = await supabase.from("track_votes").upsert(
    {
      playlist_id: playlistId,
      spotify_track_id: spotifyTrackId,
      vote,
      voter_fingerprint: voterFingerprint,
      voted_at: new Date().toISOString(),
    },
    { onConflict: "playlist_id,spotify_track_id,voter_fingerprint" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
