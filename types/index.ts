export interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  duration_ms: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  tracks: { total: number };
  owner: { id: string; display_name: string };
}

export type SwipeDirection = "keep" | "remove";

export interface SwipeRecord {
  trackId: string;
  trackName: string;
  artistName: string;
  direction: SwipeDirection;
}

export interface StreakState {
  type: SwipeDirection;
  count: number;
}

export type DopamineEvent =
  | "on-fire"
  | "confetti"
  | "legendary"
  | "spring-clean"
  | "keep"
  | "remove"
  | null;
