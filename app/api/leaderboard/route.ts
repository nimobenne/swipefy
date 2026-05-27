import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";
import { currentWeekStart } from "@/lib/weekly";

export interface LeaderboardEntry {
  id: string;
  name: string;
  cover_url: string | null;
  owner_display_name: string;
  spotify_playlist_id: string;
  approval_pct: number;
  total_votes: number;
  unique_voters: number;
  ranked: boolean;
  spotify_url: string | null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekOf = currentWeekStart();

  const { data: playlists, error } = await supabase
    .from("public_playlists")
    .select("id, name, cover_url, owner_display_name, spotify_playlist_id")
    .eq("week_of", weekOf)
    .eq("is_active", true);

  if (error) {
    console.error("[leaderboard] playlist fetch failed", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!playlists?.length) {
    return NextResponse.json({ week: weekOf, playlists: [] });
  }

  const ids = playlists.map((p) => p.id);
  const { data: scores } = await supabase
    .from("playlist_scores")
    .select("playlist_id, approval_pct, total_votes, unique_voters")
    .in("playlist_id", ids);

  const scoreMap: Record<string, { approval_pct: number; total_votes: number; unique_voters: number }> = {};
  for (const s of scores ?? []) {
    scoreMap[s.playlist_id] = {
      approval_pct: s.approval_pct ?? 0,
      total_votes: s.total_votes ?? 0,
      unique_voters: s.unique_voters ?? 0,
    };
  }

  const entries: LeaderboardEntry[] = playlists.map((p) => {
    const score = scoreMap[p.id] ?? { approval_pct: 0, total_votes: 0, unique_voters: 0 };
    const ranked = score.total_votes >= 50;
    return {
      id: p.id,
      name: p.name,
      cover_url: p.cover_url,
      owner_display_name: p.owner_display_name,
      spotify_playlist_id: p.spotify_playlist_id,
      approval_pct: score.approval_pct,
      total_votes: score.total_votes,
      unique_voters: score.unique_voters,
      ranked,
      spotify_url: score.approval_pct >= 80
        ? `https://open.spotify.com/playlist/${p.spotify_playlist_id}`
        : null,
    };
  });

  entries.sort((a, b) => {
    if (a.ranked && !b.ranked) return -1;
    if (!a.ranked && b.ranked) return 1;
    if (a.ranked && b.ranked) return b.approval_pct - a.approval_pct;
    return b.total_votes - a.total_votes;
  });

  return NextResponse.json({ week: weekOf, playlists: entries });
}
