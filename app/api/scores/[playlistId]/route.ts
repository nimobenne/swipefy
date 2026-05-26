import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playlistId } = await params;

  // Overall score from view
  const { data: score } = await supabase
    .from("playlist_scores")
    .select("*")
    .eq("playlist_id", playlistId)
    .single();

  // Per-track breakdown
  const { data: trackVotes } = await supabase
    .from("track_votes")
    .select("spotify_track_id, vote")
    .eq("playlist_id", playlistId);

  const trackBreakdown: Record<string, { yes: number; no: number; pct: number }> = {};
  for (const row of trackVotes ?? []) {
    if (!trackBreakdown[row.spotify_track_id]) {
      trackBreakdown[row.spotify_track_id] = { yes: 0, no: 0, pct: 0 };
    }
    if (row.vote) trackBreakdown[row.spotify_track_id].yes++;
    else trackBreakdown[row.spotify_track_id].no++;
  }
  for (const t of Object.values(trackBreakdown)) {
    const total = t.yes + t.no;
    t.pct = total > 0 ? Math.round((t.yes / total) * 100) : 0;
  }

  return NextResponse.json({
    score: score ?? { total_votes: 0, approval_pct: 0, unique_voters: 0 },
    trackBreakdown,
  });
}
