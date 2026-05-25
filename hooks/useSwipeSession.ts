"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { SpotifyTrack, SwipeDirection, StreakState, DopamineEvent } from "@/types";

interface UseSwipeSessionProps {
  tracks: SpotifyTrack[];
  playlistId: string;
  onComplete: (kept: SpotifyTrack[], removed: SpotifyTrack[]) => void;
}

function fireRemoveRequest(playlistId: string, trackId: string) {
  const body = JSON.stringify({ trackId });
  fetch(`/api/playlist/${playlistId}/remove`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body,
  })
    .then((r) => {
      if (!r.ok) r.json().then((d) => console.error("[Swipefy] Remove failed:", d.error));
    })
    .catch(() => {
      setTimeout(() => {
        fetch(`/api/playlist/${playlistId}/remove`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body,
        }).catch(() => console.warn("[Swipefy] Failed to remove track from Spotify:", trackId));
      }, 1500);
    });
}

export function useSwipeSession({
  tracks,
  playlistId,
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

  // Flush pending removal on unmount (user navigated away mid-session)
  useEffect(() => {
    return () => {
      if (pendingRemovalRef.current) {
        clearTimeout(pendingRemovalRef.current.timeoutId);
        fireRemoveRequest(playlistId, pendingRemovalRef.current.track.id);
        pendingRemovalRef.current = null;
      }
    };
  }, [playlistId]);

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

        // Flush any previous pending removal before queuing the new one
        if (pendingRemovalRef.current) {
          clearTimeout(pendingRemovalRef.current.timeoutId);
          fireRemoveRequest(playlistId, pendingRemovalRef.current.track.id);
          pendingRemovalRef.current = null;
        }

        // Buffer this removal — user has 4s to undo
        const timeoutId = setTimeout(() => {
          fireRemoveRequest(playlistId, track.id);
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
        // Flush pending removal before navigating to results
        if (pendingRemovalRef.current) {
          clearTimeout(pendingRemovalRef.current.timeoutId);
          fireRemoveRequest(playlistId, pendingRemovalRef.current.track.id);
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
    [currentIndex, tracks, kept, removed, playlistId, onComplete, triggerDopamine]
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
