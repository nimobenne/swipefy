"use client";
import { useState, useCallback } from "react";
import type { PublicPlaylist } from "@/lib/supabase";

export function usePublicFeed() {
  const [current, setCurrent] = useState<PublicPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [exhausted, setExhausted] = useState(false);

  const fetchNext = useCallback(
    async (excludeId?: string) => {
      setLoading(true);
      const ids = excludeId ? [...seenIds, excludeId] : seenIds;
      setSeenIds(ids);
      try {
        const res = await fetch(`/api/playlists/feed?exclude=${ids.join(",")}`);
        const data = await res.json();
        if (!data.playlist) {
          setExhausted(true);
          setCurrent(null);
        } else {
          setCurrent(data.playlist);
          setExhausted(false);
        }
      } catch {
        setExhausted(true);
      } finally {
        setLoading(false);
      }
    },
    [seenIds]
  );

  return { current, loading, exhausted, fetchNext };
}
