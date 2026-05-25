import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { removeTrackFromPlaylist } from "@/lib/spotify";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { trackId } = await req.json();

  if (!trackId) {
    return NextResponse.json({ error: "trackId required" }, { status: 400 });
  }

  // Diagnostic: log who owns this playlist vs who is authenticated
  try {
    const [meRes, playlistRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }),
      fetch(`https://api.spotify.com/v1/playlists/${id}?fields=owner`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }),
    ]);
    const me = await meRes.json();
    const playlist = await playlistRes.json();
    console.log("[remove-diag] userId:", me.id, "ownerID:", playlist.owner?.id, "match:", me.id === playlist.owner?.id);
  } catch (e) {
    console.log("[remove-diag] fetch failed", e);
  }

  try {
    await removeTrackFromPlaylist(session.accessToken, id, trackId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[remove]", id, trackId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
