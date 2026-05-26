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

  const { data, error } = await supabase
    .from("public_playlists")
    .select(`
      *,
      playlist_scores (total_votes, approval_pct)
    `)
    .eq("is_active", true)
    .neq("owner_id", session.userId)
    .not("id", "in", excludeIds.length > 0 ? `(${excludeIds.join(",")})` : "(00000000-0000-0000-0000-000000000000)")
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ playlist: null });
  }

  // Sort: new (< 50 votes) first by recency, established by approval
  const sorted = [...data].sort((a, b) => {
    const aVotes = (a.playlist_scores as { total_votes: number } | null)?.total_votes ?? 0;
    const bVotes = (b.playlist_scores as { total_votes: number } | null)?.total_votes ?? 0;
    const aNew = aVotes < 50;
    const bNew = bVotes < 50;

    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    if (aNew && bNew) {
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
    }
    const aPct = (a.playlist_scores as { approval_pct: number } | null)?.approval_pct ?? 0;
    const bPct = (b.playlist_scores as { approval_pct: number } | null)?.approval_pct ?? 0;
    return bPct - aPct;
  });

  return NextResponse.json({ playlist: sorted[0] });
}
