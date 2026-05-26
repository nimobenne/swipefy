import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const excludeIds = searchParams.get("exclude")?.split(",").filter(Boolean) ?? [];

  // Fetch active playlists, skipping own and already-seen
  let query = supabase
    .from("public_playlists")
    .select("*")
    .eq("is_active", true)
    .neq("owner_id", session.userId)
    .limit(20);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data: playlists, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!playlists || playlists.length === 0) {
    return NextResponse.json({ playlist: null });
  }

  // Fetch scores for these playlists
  const playlistIds = playlists.map((p) => p.id);
  const { data: scores } = await supabase
    .from("playlist_scores")
    .select("playlist_id, total_votes, approval_pct")
    .in("playlist_id", playlistIds);

  const scoreMap: Record<string, { total_votes: number; approval_pct: number }> = {};
  for (const s of scores ?? []) {
    scoreMap[s.playlist_id] = { total_votes: s.total_votes, approval_pct: s.approval_pct };
  }

  // Sort: new (< 50 votes) first by recency, established by approval_pct
  const sorted = [...playlists].sort((a, b) => {
    const aVotes = scoreMap[a.id]?.total_votes ?? 0;
    const bVotes = scoreMap[b.id]?.total_votes ?? 0;
    const aNew = aVotes < 50;
    const bNew = bVotes < 50;

    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    if (aNew && bNew) {
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
    }
    return (scoreMap[b.id]?.approval_pct ?? 0) - (scoreMap[a.id]?.approval_pct ?? 0);
  });

  return NextResponse.json({ playlist: sorted[0] });
}
