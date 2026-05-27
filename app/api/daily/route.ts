import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";
import { currentWeekStart, sampleTracks } from "@/lib/weekly";
import type { SpotifyTrack } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.userId;
  const weekOf = currentWeekStart();
  const today = new Date().toISOString().split("T")[0];

  // Check if user already has a completed session today
  const { data: todaySession } = await supabase
    .from("daily_sessions")
    .select("playlist_id, completed_at")
    .eq("user_id", userId)
    .eq("session_date", today)
    .single();

  if (todaySession?.completed_at) {
    return NextResponse.json({ done: true, comeBackTomorrow: true });
  }

  // Get all active playlists for this week
  const { data: weekPlaylists, error: playlistError } = await supabase
    .from("public_playlists")
    .select("id, name, cover_url, owner_display_name, spotify_playlist_id, tracks_json")
    .eq("week_of", weekOf)
    .eq("is_active", true);

  if (playlistError || !weekPlaylists?.length) {
    return NextResponse.json({ done: true, noContent: true });
  }

  // Get playlists user has already completed this week
  const { data: completedSessions } = await supabase
    .from("daily_sessions")
    .select("playlist_id")
    .eq("user_id", userId)
    .gte("session_date", weekOf)
    .not("completed_at", "is", null);

  const completedIds = new Set((completedSessions ?? []).map((s) => s.playlist_id));

  // Find next unvoted playlist
  const next = weekPlaylists.find((p) => !completedIds.has(p.id));

  if (!next) {
    return NextResponse.json({ done: true, weekComplete: true });
  }

  // Ensure weekly sample exists for this playlist (lazy creation)
  let { data: sample } = await supabase
    .from("weekly_samples")
    .select("sampled_tracks")
    .eq("playlist_id", next.id)
    .eq("week_of", weekOf)
    .single();

  if (!sample) {
    const tracks = (next.tracks_json ?? []) as SpotifyTrack[];
    const sampled = sampleTracks(tracks, 15);
    await supabase.from("weekly_samples").insert({
      playlist_id: next.id,
      week_of: weekOf,
      sampled_tracks: sampled,
    });
    sample = { sampled_tracks: sampled };
  }

  // Create or update today's session record (in-progress)
  await supabase.from("daily_sessions").upsert(
    { user_id: userId, session_date: today, playlist_id: next.id },
    { onConflict: "user_id,session_date" }
  );

  return NextResponse.json({
    playlist: {
      id: next.id,
      name: next.name,
      cover_url: next.cover_url,
      owner_display_name: next.owner_display_name,
      spotify_playlist_id: next.spotify_playlist_id,
    },
    tracks: sample.sampled_tracks as SpotifyTrack[],
    weekOf,
    totalThisWeek: weekPlaylists.length,
    doneThisWeek: completedIds.size,
  });
}
