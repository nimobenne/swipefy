import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getServiceClient } from "@/lib/supabase";

const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabase) return NextResponse.json({ success: true });

  const { trackId, trackName, artistName, direction, playlistId, sessionId } =
    await req.json();

  const db = getServiceClient();

  const { error } = await db.from("swipes").insert({
    session_id: sessionId ?? null,
    track_id: trackId,
    track_name: trackName,
    artist_name: artistName,
    direction,
    playlist_id: playlistId ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabase) return NextResponse.json({ sessionId: null });

  const { playlistId, playlistName } = await req.json();
  const db = getServiceClient();

  const userId = (session as { user?: { email?: string } }).user?.email ?? "unknown";

  const { data, error } = await db
    .from("swipe_sessions")
    .insert({ user_id: userId, playlist_id: playlistId, playlist_name: playlistName })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id });
}
