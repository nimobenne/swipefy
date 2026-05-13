"use client";
import { useState, useCallback, useRef } from "react";
import { SpotifyTrack, SwipeDirection, StreakState, DopamineEvent } from "@/types";

interface UseSwipeSessionProps {
  tracks: SpotifyTrack[];
  playlistId: string;
  sessionId: string | null;
  onComplete: (kept: SpotifyTrack[], removed: SpotifyTrack[]) => void;
}

export function useSwipeSession({
  tracks,
  playlistId,
  sessionId,
  onComplete,
}: UseSwipeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [kept, setKept] = useState<SpotifyTrack[]>([]);
  const [removed, setRemoved] = useState<SpotifyTrack[]>([]);
  const [streak, setStreak] = useState<StreakState>({ type: "keep", count: 0 });
  const [dopamineEvent, setDopamineEvent] = useState<DopamineEvent>(null);
  const processingRef = useRef(false);

  const triggerDopamine = useCallback((event: DopamineEvent) => {
    setDopamineEvent(event);
    setTimeout(() => setDopamineEvent(null), 2000);
  }, []);

  const swipe = useCallback(
    async (direction: SwipeDirection) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const track = tracks[currentIndex];
      if (!track) return;

      if (direction === "keep") {
        setKept((prev) => [...prev, track]);
      } else {
        setRemoved((prev) => [...prev, track]);
        // Fire-and-forget remove from Spotify
        fetch(`/api/playlist/${playlistId}/remove`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId: track.id }),
        }).catch(() => {});
      }

      // Save swipe to Supabase (fire-and-forget)
      fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: track.id,
          trackName: track.name,
          artistName: track.artists[0]?.name ?? "",
          direction,
          playlistId,
          sessionId,
        }),
      }).catch(() => {});

      // Update streak + dopamine
      setStreak((prev) => {
        const sameType = prev.type === direction;
        const newCount = sameType ? prev.count + 1 : 1;

        if (direction === "keep") {
          if (newCount === 3) triggerDopamine("on-fire");
          else if (newCount === 5) triggerDopamine("confetti");
          else if (newCount >= 10) triggerDopamine("legendary");
          else triggerDopamine("keep");
        } else {
          if (newCount >= 10) triggerDopamine("spring-clean");
          else triggerDopamine("remove");
        }

        return { type: direction, count: newCount };
      });

      const nextIndex = currentIndex + 1;
      if (nextIndex >= tracks.length) {
        setTimeout(() => {
          onComplete(
            direction === "keep" ? [...kept, track] : kept,
            direction === "remove" ? [...removed, track] : removed
          );
        }, 400);
      } else {
        setCurrentIndex(nextIndex);
      }

      setTimeout(() => {
        processingRef.current = false;
      }, 350);
    },
    [currentIndex, tracks, kept, removed, playlistId, sessionId, onComplete, triggerDopamine]
  );

  const currentTrack = tracks[currentIndex] ?? null;
  const nextTrack = tracks[currentIndex + 1] ?? null;
  const thirdTrack = tracks[currentIndex + 2] ?? null;
  const progress = tracks.length > 0 ? currentIndex / tracks.length : 0;

  return {
    currentTrack,
    nextTrack,
    thirdTrack,
    currentIndex,
    total: tracks.length,
    progress,
    kept,
    removed,
    streak,
    dopamineEvent,
    swipe,
  };
}
