import { SpotifyTrack, SpotifyPlaylist, SpotifyArtist, SpotifyAlbum } from "@/types";

async function spotifyFetch<T>(
  endpoint: string,
  accessToken: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://api.spotify.com/v1${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (res.status === 204) return null as T;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify ${res.status}: ${err}`);
  }
  return res.json();
}

export async function getUserPlaylists(
  accessToken: string
): Promise<SpotifyPlaylist[]> {
  const playlists: SpotifyPlaylist[] = [];
  let url: string | null = "/me/playlists?limit=50";

  while (url) {
    const data: { items: SpotifyPlaylist[]; next: string | null } =
      await spotifyFetch<{ items: SpotifyPlaylist[]; next: string | null }>(
        url,
        accessToken
      );
    playlists.push(...data.items.filter(Boolean));
    url = data.next;
  }

  return playlists;
}

export async function getLikedTracksCount(accessToken: string): Promise<number> {
  const data = await spotifyFetch<{ total: number }>("/me/tracks?limit=1", accessToken);
  return data.total;
}

interface RawItem {
  id?: string | null;
  name?: string;
  artists?: SpotifyArtist[];
  album?: SpotifyAlbum;
  preview_url?: string | null;
  duration_ms?: number;
  type?: string;
}

interface TracksPage {
  items: { item?: RawItem | null; track?: RawItem | null }[];
  next: string | null;
  total?: number;
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let url: string | null =
    playlistId === "liked"
      ? "/me/tracks?limit=50"
      : `/playlists/${playlistId}/items?limit=100`;

  while (url) {
    const page: TracksPage = await spotifyFetch<TracksPage>(url, accessToken);
    for (const raw of page.items) {
      const t = raw.item ?? raw.track;
      if (t?.id && t.name && t.artists && t.album && t.type === "track") {
        tracks.push({
          id: t.id,
          name: t.name,
          artists: t.artists,
          album: t.album,
          preview_url: t.preview_url ?? null,
          duration_ms: t.duration_ms ?? 0,
        });
      }
    }
    url = page.next;
  }

  return tracks;
}

export async function removeTrackFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackId: string
): Promise<void> {
  if (playlistId === "liked") {
    await spotifyFetch<null>("/me/tracks", accessToken, {
      method: "DELETE",
      body: JSON.stringify({ ids: [trackId] }),
    });
  } else {
    await spotifyFetch<null>(`/playlists/${playlistId}/tracks`, accessToken, {
      method: "DELETE",
      body: JSON.stringify({
        tracks: [{ uri: `spotify:track:${trackId}` }],
      }),
    });
  }
}
