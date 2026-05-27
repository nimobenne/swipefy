import type { SpotifyTrack } from "@/types";

export function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  return monday.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function sampleTracks(tracks: SpotifyTrack[], n = 15): SpotifyTrack[] {
  if (tracks.length <= n) return [...tracks];
  const shuffled = [...tracks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
