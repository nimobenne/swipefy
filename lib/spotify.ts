import { SpotifyTrack, SpotifyPlaylist } from "@/types";

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
  const data = await spotifyFetch<{ items: SpotifyPlaylist[]; next: string | null }>(
    "/me/playlists?limit=50",
    accessToken
  );
  return data.items.filter(Boolean);
}

interface TracksPage {
  items: { track: SpotifyTrack | null }[];
  next: string | null;
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string
): Promise<{ tracks: SpotifyTrack[]; debug: unknown }> {
  const tracks: SpotifyTrack[] = [];
  let url: string | null = `/playlists/${playlistId}/items?limit=100`;
  let firstPage: unknown = null;

  while (url) {
    const page: TracksPage = await spotifyFetch<TracksPage>(url, accessToken);
    if (!firstPage) firstPage = { total: page.items?.length, first: page.items?.[0] };
    for (const item of page.items) {
      if (item.track?.id) tracks.push(item.track);
    }
    url = page.next;
  }

  return { tracks, debug: firstPage };
}

export async function removeTrackFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackId: string
): Promise<void> {
  await spotifyFetch<null>(`/playlists/${playlistId}/tracks`, accessToken, {
    method: "DELETE",
    body: JSON.stringify({
      tracks: [{ uri: `spotify:track:${trackId}` }],
    }),
  });
}
