import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getUserPlaylists, getLikedTracksCount } from "@/lib/spotify";
import { SpotifyPlaylist } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [playlists, likedCount] = await Promise.all([
      getUserPlaylists(session.accessToken),
      getLikedTracksCount(session.accessToken).catch(() => 0),
    ]);

    const likedPlaylist: SpotifyPlaylist = {
      id: "liked",
      name: "Liked Songs",
      description: "Your saved tracks",
      images: [],
      tracks: { total: likedCount },
      owner: { display_name: "You" },
    };

    return NextResponse.json({ playlists: [likedPlaylist, ...playlists] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
