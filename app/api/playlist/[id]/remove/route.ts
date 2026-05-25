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

  try {
    await removeTrackFromPlaylist(session.accessToken, id, trackId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[remove]", id, trackId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
