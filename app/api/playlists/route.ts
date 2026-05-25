import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getUserPlaylists, getLikedTracksCount } from "@/lib/spotify";
import { SpotifyPlaylist } from "@/types";

async function getSpotifyUserId(accessToken: string): Promise<string> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.id as string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [playlists, likedCount, userId] = await Promise.all([
      getUserPlaylists(session.accessToken),
      getLikedTracksCount(session.accessToken).catch(() => 0),
      getSpotifyUserId(session.accessToken),
    ]);

    // Only show playlists the user owns — followed playlists can't be edited
    const owned = playlists.filter((p) => p.owner?.id === userId);

    const likedPlaylist: SpotifyPlaylist = {
      id: "liked",
      name: "Liked Songs",
      description: "Your saved tracks",
      images: [],
      tracks: { total: likedCount },
      owner: { id: userId, display_name: "You" },
    };

    return NextResponse.json({ playlists: [likedPlaylist, ...owned] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
