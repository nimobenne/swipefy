"use client";
import { useEffect, useRef, useState } from "react";
import { SpotifyTrack } from "@/types";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wordsA = new Set(na.split(" "));
  const wordsB = nb.split(" ");
  const overlap = wordsB.filter((w) => wordsA.has(w)).length;
  return overlap / Math.max(wordsA.size, wordsB.length);
}

async function fetchItunesPreview(track: SpotifyTrack): Promise<string | null> {
  const artistName = track.artists[0]?.name ?? "";
  const query = encodeURIComponent(`${track.name} ${artistName}`);
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=10`
    );
    const data = await res.json();
    const results: { trackName: string; artistName: string; previewUrl?: string }[] =
      data.results ?? [];

    // Score each result by how well both track name AND artist match
    const scored = results
      .filter((r) => r.previewUrl)
      .map((r) => ({
        r,
        score:
          similarity(r.trackName, track.name) * 0.6 +
          similarity(r.artistName, artistName) * 0.4,
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    // Require a minimum score to avoid garbage matches
    if (!best || best.score < 0.4) return null;
    return best.r.previewUrl ?? null;
  } catch {
    return null;
  }
}

export function useItunesPreviews(tracks: SpotifyTrack[], currentIndex: number) {
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Prefetch current + next 2 tracks
    const toFetch = tracks.slice(currentIndex, currentIndex + 3);
    for (const track of toFetch) {
      if (previewMap[track.id] || fetchingRef.current.has(track.id)) continue;
      fetchingRef.current.add(track.id);
      fetchItunesPreview(track).then((url) => {
        if (url) setPreviewMap((prev) => ({ ...prev, [track.id]: url }));
        fetchingRef.current.delete(track.id);
      });
    }
  }, [currentIndex, tracks, previewMap]);

  return previewMap;
}
