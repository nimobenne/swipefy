import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";
import { currentWeekStart } from "@/lib/weekly";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekOf = currentWeekStart();

  const { data: nominations, error } = await supabase
    .from("nominations")
    .select("id, spotify_url, pitch, submitted_by, submitted_name, submitted_at, status")
    .eq("week_of", weekOf)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[nominations] fetch failed", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!nominations?.length) {
    return NextResponse.json({ nominations: [], userVotes: [] });
  }

  const ids = nominations.map((n) => n.id);

  const { data: voteCounts } = await supabase
    .from("nomination_votes")
    .select("nomination_id")
    .in("nomination_id", ids);

  const voteMap: Record<string, number> = {};
  for (const v of voteCounts ?? []) {
    voteMap[v.nomination_id] = (voteMap[v.nomination_id] ?? 0) + 1;
  }

  const { data: userVoteRows } = await supabase
    .from("nomination_votes")
    .select("nomination_id")
    .eq("user_id", session.userId)
    .in("nomination_id", ids);

  const userVotes = (userVoteRows ?? []).map((v) => v.nomination_id);

  const result = nominations
    .map((n) => ({ ...n, vote_count: voteMap[n.id] ?? 0 }))
    .sort((a, b) => b.vote_count - a.vote_count);

  return NextResponse.json({ nominations: result, userVotes });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { spotifyUrl?: unknown; pitch?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { spotifyUrl, pitch } = body as { spotifyUrl: string; pitch: string };

  if (!spotifyUrl?.trim() || !pitch?.trim()) {
    return NextResponse.json({ error: "Missing spotifyUrl or pitch" }, { status: 400 });
  }

  try {
    const u = new URL(spotifyUrl.trim());
    if (u.hostname !== "open.spotify.com" || !u.pathname.startsWith("/playlist/")) {
      return NextResponse.json({ error: "Must be a Spotify playlist URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (pitch.length > 120) {
    return NextResponse.json({ error: "Pitch must be 120 characters or less" }, { status: 400 });
  }

  const weekOf = currentWeekStart();

  const { data: existing } = await supabase
    .from("nominations")
    .select("id")
    .eq("submitted_by", session.userId)
    .eq("week_of", weekOf)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You already nominated a playlist this week" }, { status: 409 });
  }

  const { error } = await supabase.from("nominations").insert({
    spotify_url: spotifyUrl.trim(),
    pitch: pitch.trim(),
    submitted_by: session.userId,
    submitted_name: session.user?.name ?? "Anonymous",
    week_of: weekOf,
  });

  if (error) {
    console.error("[nominations] insert failed", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
