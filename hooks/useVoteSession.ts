// hooks/useVoteSession.ts
"use client";
import { useState, useCallback, useRef } from "react";
import { SpotifyTrack, StreakState, DopamineEvent, TrackVoteResult } from "@/types";

interface UseVoteSessionProps {
  tracks: SpotifyTrack[];
  playlistId: string;
  onComplete: (results: TrackVoteResult[]) => void;
}

export function useVoteSession({ tracks, playlistId, onComplete }: UseVoteSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<TrackVoteResult[]>([]);
  const [streak, setStreak] = useState<StreakState>({ type: "keep", count: 0 });
  const [dopamineEvent, setDopamineEvent] = useState<DopamineEvent>(null);
  const processingRef = useRef(false);

  const triggerDopamine = useCallback((event: DopamineEvent) => {
    setDopamineEvent(event);
    setTimeout(() => setDopamineEvent(null), 2000);
  }, []);

  const vote = useCallback(
    async (direction: "keep" | "remove") => {
      if (processingRef.current) return;
      processingRef.current = true;

      const track = tracks[currentIndex];
      if (!track) { processingRef.current = false; return; }

      const isYes = direction === "keep";
      const newResult: TrackVoteResult = { trackId: track.id, vote: isYes };

      // Fire-and-forget vote to API — don't block the swipe animation
      fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          spotifyTrackId: track.id,
          vote: isYes,
        }),
      }).catch(() => {/* silent — vote may retry on next swipe session */});

      const newResults = [...results, newResult];
      setResults(newResults);

      // Streak + dopamine (same logic as useSwipeSession)
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
        setTimeout(() => onComplete(newResults), 400);
      } else {
        setCurrentIndex(nextIndex);
      }

      setTimeout(() => { processingRef.current = false; }, 350);
    },
    [currentIndex, tracks, results, playlistId, onComplete, triggerDopamine]
  );

  return {
    currentTrack: tracks[currentIndex] ?? null,
    nextTrack: tracks[currentIndex + 1] ?? null,
    thirdTrack: tracks[currentIndex + 2] ?? null,
    currentIndex,
    total: tracks.length,
    progress: tracks.length > 0 ? currentIndex / tracks.length : 0,
    streak,
    dopamineEvent,
    vote,
    results,
  };
}
