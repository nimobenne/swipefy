import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/admin";
import { getAdminAccessToken } from "@/lib/spotify-admin-token";
import { NextResponse } from "next/server";

interface RawPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let accessToken: string;
  try {
    accessToken = await getAdminAccessToken(session.userId);
  } catch (e) {
    if (e instanceof Error && e.message === "no_spotify_token") {
      return NextResponse.json({ connected: false });
    }
    return NextResponse.json({ error: "Token error" }, { status: 500 });
  }

  const playlists: RawPlaylist[] = [];
  let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";

  while (url && playlists.length < 200) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Spotify error: ${res.status}` }, { status: 500 });
    }
    const data = await res.json();
    playlists.push(...(data.items ?? []));
    url = data.next ?? null;
  }

  return NextResponse.json({
    connected: true,
    playlists: playlists.map((p) => ({
      id: p.id,
      name: p.name,
      coverUrl: p.images?.[0]?.url ?? null,
      trackCount: p.tracks?.total ?? 0,
      owner: p.owner?.display_name ?? "",
    })),
  });
}
