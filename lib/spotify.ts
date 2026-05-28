import { SpotifyTrack, SpotifyArtist, SpotifyAlbum } from "@/types";

const tokenCache = { token: "", expiresAt: 0 };

export async function getClientCredentialsToken(): Promise<string> {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
  const data = await res.json();
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return tokenCache.token;
}

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

export interface PlaylistMetadata {
  name: string;
  coverUrl: string | null;
  trackCount: number;
  ownerDisplayName: string;
}

export async function getPlaylistMetadata(
  playlistId: string
): Promise<PlaylistMetadata> {
  const token = await getClientCredentialsToken();
  const data = await spotifyFetch<{
    name: string;
    images?: { url: string }[];
    tracks?: { total: number };
    owner?: { display_name: string };
  }>(
    `/playlists/${playlistId}?fields=name,images,tracks.total,owner.display_name`,
    token
  );
  return {
    name: data.name,
    coverUrl: data.images?.[0]?.url ?? null,
    trackCount: data.tracks?.total ?? 0,
    ownerDisplayName: data.owner?.display_name ?? "Unknown",
  };
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

interface FullPlaylistResponse {
  tracks: {
    items: { track?: RawItem | null; item?: RawItem | null }[];
    next: string | null;
    total?: number;
  };
}

function parseTracksFromItems(
  items: { track?: RawItem | null; item?: RawItem | null }[]
): SpotifyTrack[] {
  const out: SpotifyTrack[] = [];
  for (const raw of items) {
    const t = raw.track ?? raw.item;
    if (t?.id && t.name && t.artists?.length && t.album) {
      out.push({
        id: t.id,
        name: t.name,
        artists: t.artists,
        album: t.album,
        preview_url: t.preview_url ?? null,
        duration_ms: t.duration_ms ?? 0,
      });
    }
  }
  return out;
}

export async function getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  const token = await getClientCredentialsToken();

  // Fetch full playlist object — no fields filter so we get tracks.items without syntax guessing.
  // Works for public playlists with client credentials. Default limit is 100 tracks per page.
  const data = await spotifyFetch<FullPlaylistResponse>(`/playlists/${playlistId}`, token);

  const tracks = parseTracksFromItems(data.tracks?.items ?? []);

  let url = data.tracks?.next ?? null;
  while (url) {
    const page = await spotifyFetch<{ items: FullPlaylistResponse["tracks"]["items"]; next: string | null }>(url, token);
    tracks.push(...parseTracksFromItems(page.items ?? []));
    url = page.next ?? null;
  }

  return tracks;
}

export async function getPlaylistTracksWithToken(
  playlistId: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  // Use full playlist object endpoint, NOT /items — the dedicated /items endpoint
  // returns 403 with user tokens in Spotify Dev Mode (Feb 2026 restrictions).
  const data = await spotifyFetch<FullPlaylistResponse>(`/playlists/${playlistId}`, accessToken);
  const tracks = parseTracksFromItems(data.tracks?.items ?? []);

  let url = data.tracks?.next ?? null;
  while (url) {
    const page = await spotifyFetch<{ items: FullPlaylistResponse["tracks"]["items"]; next: string | null }>(url, accessToken);
    tracks.push(...parseTracksFromItems(page.items ?? []));
    url = page.next ?? null;
  }

  return tracks;
}

export async function getPlaylistMetadataWithToken(
  playlistId: string,
  accessToken: string
): Promise<PlaylistMetadata> {
  const data = await spotifyFetch<{
    name: string;
    images?: { url: string }[];
    tracks?: { total: number };
    owner?: { display_name: string };
  }>(
    `/playlists/${playlistId}?fields=name,images,tracks.total,owner.display_name`,
    accessToken
  );
  return {
    name: data.name,
    coverUrl: data.images?.[0]?.url ?? null,
    trackCount: data.tracks?.total ?? 0,
    ownerDisplayName: data.owner?.display_name ?? "Unknown",
  };
}
