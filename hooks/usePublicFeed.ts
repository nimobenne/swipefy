"use client";
import { useState, useCallback, useRef } from "react";
import type { PublicPlaylist } from "@/lib/supabase";

export function usePublicFeed() {
  const [current, setCurrent] = useState<PublicPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const seenIdsRef = useRef<string[]>([]);

  const fetchNext = useCallback(async (excludeId?: string) => {
    if (excludeId && !seenIdsRef.current.includes(excludeId)) {
      seenIdsRef.current = [...seenIdsRef.current, excludeId];
    }
    setLoading(true);
    try {
      const exclude = seenIdsRef.current.join(",");
      const res = await fetch(`/api/playlists/feed${exclude ? `?exclude=${exclude}` : ""}`);
      const data = await res.json();
      if (!data.playlist) {
        setExhausted(true);
        setCurrent(null);
      } else {
        if (!seenIdsRef.current.includes(data.playlist.id)) {
          seenIdsRef.current = [...seenIdsRef.current, data.playlist.id];
        }
        setCurrent(data.playlist);
        setExhausted(false);
      }
    } catch {
      setExhausted(true);
    } finally {
      setLoading(false);
    }
  }, []); // stable — no deps, uses ref

  return { current, loading, exhausted, fetchNext };
}
