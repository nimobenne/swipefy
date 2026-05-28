"use client";
import { useState, useCallback, useRef } from "react";
import { SpotifyTrack, SwipeDirection, StreakState, DopamineEvent } from "@/types";

interface UseSwipeSessionProps {
  tracks: SpotifyTrack[];
  playlistId: string;
  onComplete: (kept: SpotifyTrack[], removed: SpotifyTrack[]) => void;
}

export function useSwipeSession({
  tracks,
  onComplete,
}: UseSwipeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [kept, setKept] = useState<SpotifyTrack[]>([]);
  const [removed, setRemoved] = useState<SpotifyTrack[]>([]);
  const [streak, setStreak] = useState<StreakState>({ type: "keep", count: 0 });
  const [dopamineEvent, setDopamineEvent] = useState<DopamineEvent>(null);
  const [pendingRemoval, setPendingRemoval] = useState<SpotifyTrack | null>(null);
  const processingRef = useRef(false);
  const pendingRemovalRef = useRef<{
    track: SpotifyTrack;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);

  const triggerDopamine = useCallback((event: DopamineEvent) => {
    setDopamineEvent(event);
    setTimeout(() => setDopamineEvent(null), 2000);
  }, []);

  const swipe = useCallback(
    async (direction: SwipeDirection) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const track = tracks[currentIndex];
      if (!track) {
        processingRef.current = false;
        return;
      }

      if (direction === "keep") {
        setKept((prev) => [...prev, track]);
      } else {
        setRemoved((prev) => [...prev, track]);

        // Cancel previous undo window
        if (pendingRemovalRef.current) {
          clearTimeout(pendingRemovalRef.current.timeoutId);
        }

        // 4s undo window — just clears the toast, no API call here
        const timeoutId = setTimeout(() => {
          pendingRemovalRef.current = null;
          setPendingRemoval(null);
        }, 4000);

        pendingRemovalRef.current = { track, timeoutId };
        setPendingRemoval(track);
      }

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
        if (pendingRemovalRef.current) {
          clearTimeout(pendingRemovalRef.current.timeoutId);
          pendingRemovalRef.current = null;
          setPendingRemoval(null);
        }

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
    [currentIndex, tracks, kept, removed, onComplete, triggerDopamine]
  );

  const undoRemove = useCallback(() => {
    if (!pendingRemovalRef.current) return;
    const { track: undoneTrack, timeoutId } = pendingRemovalRef.current;
    clearTimeout(timeoutId);
    pendingRemovalRef.current = null;
    setPendingRemoval(null);
    setRemoved((prev) => prev.filter((t) => t.id !== undoneTrack.id));
  }, []);

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
    pendingRemoval,
    undoRemove,
    swipe,
  };
}
