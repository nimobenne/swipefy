"use client";
import { useEffect, useState, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SwipeStack, { SwipeStackHandle } from "@/components/SwipeStack";
import ActionButtons from "@/components/ActionButtons";
import StreakCounter from "@/components/StreakCounter";
import DopamineOverlay from "@/components/DopamineOverlay";
import { useSwipeSession } from "@/hooks/useSwipeSession";
import { SpotifyTrack } from "@/types";

interface PageProps {
  params: Promise<{ playlistId: string }>;
}

export default function SwipePage({ params }: PageProps) {
  const { playlistId } = use(params);
  const searchParams = useSearchParams();
  const playlistName = searchParams.get("name") ?? "Playlist";

  const { data: session, status } = useSession({ required: true });
  const router = useRouter();

  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const stackRef = useRef<SwipeStackHandle>(null);

  // Create Supabase session — must resolve before swipes start so session_id is never null
  useEffect(() => {
    fetch("/api/swipe", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId, playlistName }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.sessionId) setSessionId(d.sessionId);
      })
      .catch(() => {})
      .finally(() => setSessionReady(true));
  }, [playlistId, playlistName]);

  // Load tracks
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/playlist/${playlistId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTracks(data.tracks);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, playlistId]);

  const handleComplete = (kept: SpotifyTrack[], removed: SpotifyTrack[]) => {
    router.push(
      `/results/${playlistId}?kept=${kept.length}&removed=${removed.length}&name=${encodeURIComponent(playlistName)}`
    );
  };

  const {
    currentTrack,
    nextTrack,
    thirdTrack,
    currentIndex,
    total,
    progress,
    kept,
    removed,
    streak,
    dopamineEvent,
    pendingRemoval,
    undoRemove,
    swipe,
  } = useSwipeSession({
    tracks,
    playlistId,
    sessionId,
    onComplete: handleComplete,
  });

  const progressPct = Math.round(progress * 100);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
        <p className="text-subtext text-sm">Loading tracks…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-remove text-lg font-bold">Something went wrong</p>
        <p className="text-subtext text-sm text-center">{error}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-6 py-3 rounded-2xl bg-white/10 text-white text-sm font-semibold"
        >
          Back to playlists
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col max-w-md mx-auto px-4 py-6 relative">
      {/* Top bar */}
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="text-subtext hover:text-white transition-colors p-1"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-white font-bold text-sm truncate max-w-[180px]">{playlistName}</p>
          <p className="text-subtext text-xs">
            {currentIndex + 1} / {total}
          </p>
        </div>

        <div className="w-7" />
      </motion.div>

      {/* Progress bar */}
      <div className="mb-4 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #1DB954, #17a349)" }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>

      {/* Streak */}
      <div className="mb-4">
        <StreakCounter
          streak={streak}
          kept={kept.length}
          removed={removed.length}
          total={total}
        />
      </div>

      {/* Card stack */}
      <div className="relative flex-1 min-h-0" style={{ height: "calc(100vh - 280px)", maxHeight: 520 }}>
        <AnimatePresence>
          {currentTrack ? (
            <SwipeStack
              ref={stackRef}
              currentTrack={currentTrack}
              nextTrack={nextTrack}
              thirdTrack={thirdTrack}
              onSwipe={swipe}
            />
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <p className="text-4xl">🎵</p>
              <p className="text-white font-bold">No swipeable tracks</p>
              <p className="text-subtext text-sm">
                This playlist has no tracks with previews, or contains only podcasts.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold"
              >
                Pick another playlist
              </button>
            </div>
          ) : null}
        </AnimatePresence>

        {/* Dopamine overlay sits on top of card */}
        <DopamineOverlay event={dopamineEvent} />
      </div>

      {/* Undo toast */}
      <AnimatePresence>
        {pendingRemoval && (
          <motion.div
            key="undo-toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-28 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-3 bg-neutral-900/95 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl max-w-sm w-full pointer-events-auto">
              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-xs">Removed from playlist</p>
                <p className="text-white text-sm font-semibold truncate">{pendingRemoval.name}</p>
              </div>
              <button
                onClick={undoRemove}
                className="text-spotify-green font-bold text-sm shrink-0 px-2"
              >
                Undo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="mt-6">
        <ActionButtons
          onRemove={() => stackRef.current?.swipe("remove")}
          onKeep={() => stackRef.current?.swipe("keep")}
          disabled={!currentTrack}
        />
        <p className="text-center text-white/20 text-xs mt-3">
          ← J / L → · Space to pause
        </p>
      </div>
    </main>
  );
}
