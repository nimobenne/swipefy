"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SwipeStack, { SwipeStackHandle } from "@/components/SwipeStack";
import ActionButtons from "@/components/ActionButtons";
import StreakCounter from "@/components/StreakCounter";
import DopamineOverlay from "@/components/DopamineOverlay";
import ScoreReveal from "@/components/ScoreReveal";
import { useVoteSession } from "@/hooks/useVoteSession";
import { usePublicFeed } from "@/hooks/usePublicFeed";
import { useItunesPreviews } from "@/hooks/useItunesPreviews";
import type { SpotifyTrack, TrackVoteResult } from "@/types";

export default function DiscoverPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const { current: playlist, loading: feedLoading, exhausted, fetchNext } = usePublicFeed();
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [crowdPct, setCrowdPct] = useState<number | null>(null);
  const [voteResults, setVoteResults] = useState<TrackVoteResult[]>([]);
  const stackRef = useRef<SwipeStackHandle>(null);

  // Fetch first playlist on mount
  useEffect(() => {
    if (status === "authenticated") fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Load tracks when playlist changes
  useEffect(() => {
    if (!playlist || !session?.accessToken) return;
    setTracksLoading(true);
    setShowReveal(false);
    setVoteResults([]);
    setCrowdPct(null);
    fetch(`/api/playlist/${playlist.spotify_playlist_id}`)
      .then((r) => r.json())
      .then((d) => setTracks(d.tracks ?? []))
      .finally(() => setTracksLoading(false));
  }, [playlist?.id, session?.accessToken]);

  const handleComplete = async (results: TrackVoteResult[]) => {
    setVoteResults(results);
    setShowReveal(true);
    setTimeout(async () => {
      if (!playlist) return;
      try {
        const res = await fetch(`/api/scores/${playlist.id}`);
        const data = await res.json();
        setCrowdPct(data.score?.approval_pct ?? null);
      } catch {
        setCrowdPct(null);
      }
    }, 800);
  };

  const handleNext = () => {
    setCrowdPct(null);
    setVoteResults([]);
    setTracks([]);
    fetchNext(playlist?.id);
  };

  const { currentTrack, nextTrack, thirdTrack, currentIndex, total, progress, streak, dopamineEvent, vote } =
    useVoteSession({
      tracks,
      playlistId: playlist?.id ?? "",
      onComplete: handleComplete,
    });

  const itunesPreviews = useItunesPreviews(tracks, currentIndex);

  // Derive kept/removed counts from results for StreakCounter
  const keptCount = voteResults.filter((r) => r.vote).length;
  const removedCount = voteResults.filter((r) => !r.vote).length;

  const progressPct = Math.round(progress * 100);

  if (status === "loading" || feedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
      </div>
    );
  }

  if (exhausted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-4xl">🎵</p>
        <p className="text-white font-bold text-lg">You&apos;ve heard everything</p>
        <p className="text-subtext text-sm">Check back later — new playlists are added all the time.</p>
        <button
          onClick={() => router.push("/submit")}
          className="mt-4 px-6 py-3 rounded-2xl bg-spotify-green text-black font-black text-sm"
        >
          Submit your playlist
        </button>
      </div>
    );
  }

  if (showReveal && playlist) {
    return (
      <ScoreReveal
        playlist={playlist}
        results={voteResults}
        crowdPct={crowdPct}
        onNext={handleNext}
      />
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
        <div className="text-center flex-1">
          <p className="text-white font-bold text-sm truncate max-w-[200px] mx-auto">
            {playlist?.name ?? "Loading..."}
          </p>
          <p className="text-subtext text-xs">by {playlist?.owner_display_name}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-subtext hover:text-white transition-colors p-1 text-xs"
          title="Your stats"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
          </svg>
        </button>
      </motion.div>

      {/* Progress bar */}
      <div className="mb-4 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #1DB954, #17a349)" }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>

      <div className="mb-4">
        <StreakCounter streak={streak} kept={keptCount} removed={removedCount} total={total} />
      </div>

      <div className="relative w-full" style={{ height: 440 }}>
        <AnimatePresence>
          {currentTrack && (
            <SwipeStack
              ref={stackRef}
              currentTrack={currentTrack}
              nextTrack={nextTrack}
              thirdTrack={thirdTrack}
              onSwipe={vote}
              previewUrl={itunesPreviews[currentTrack.id] ?? currentTrack.preview_url ?? null}
              disabled={tracksLoading}
            />
          )}
        </AnimatePresence>
        <DopamineOverlay event={dopamineEvent} />
      </div>

      <div className="mt-6">
        <ActionButtons
          onRemove={() => stackRef.current?.swipe("remove")}
          onKeep={() => stackRef.current?.swipe("keep")}
          disabled={!currentTrack || tracksLoading}
        />
        <button
          onClick={() => fetchNext(playlist?.id)}
          className="w-full text-center text-subtext text-xs mt-3 hover:text-white transition-colors"
        >
          Skip playlist →
        </button>
      </div>
    </main>
  );
}
