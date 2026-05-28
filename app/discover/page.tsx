"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SwipeStack, { SwipeStackHandle } from "@/components/SwipeStack";
import ActionButtons from "@/components/ActionButtons";
import UserMenu from "@/components/UserMenu";
import BottomNav from "@/components/BottomNav";
import StreakCounter from "@/components/StreakCounter";
import DopamineOverlay from "@/components/DopamineOverlay";
import ScoreReveal from "@/components/ScoreReveal";
import { useVoteSession } from "@/hooks/useVoteSession";
import { useItunesPreviews } from "@/hooks/useItunesPreviews";
import type { SpotifyTrack, TrackVoteResult } from "@/types";
import type { PublicPlaylist } from "@/lib/supabase";

interface DailyResponse {
  done?: boolean;
  comeBackTomorrow?: boolean;
  weekComplete?: boolean;
  noContent?: boolean;
  playlist?: PublicPlaylist;
  tracks?: SpotifyTrack[];
  weekOf?: string;
  totalThisWeek?: number;
  doneThisWeek?: number;
}

export default function DiscoverPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReveal, setShowReveal] = useState(false);
  const [crowdPct, setCrowdPct] = useState<number | null>(null);
  const [voteResults, setVoteResults] = useState<TrackVoteResult[]>([]);
  const stackRef = useRef<SwipeStackHandle>(null);
  const crowdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDaily = async () => {
    setLoading(true);
    setShowReveal(false);
    setVoteResults([]);
    setCrowdPct(null);
    try {
      const res = await fetch("/api/daily");
      const data: DailyResponse = await res.json();
      setDailyData(data);
    } catch {
      setDailyData({ done: true, noContent: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchDaily();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = async (results: TrackVoteResult[]) => {
    setVoteResults(results);
    setShowReveal(true);
    await fetch("/api/daily/complete", { method: "POST" });
    if (crowdTimerRef.current) clearTimeout(crowdTimerRef.current);
    crowdTimerRef.current = setTimeout(async () => {
      if (!dailyData?.playlist) return;
      try {
        const res = await fetch(`/api/scores/${dailyData.playlist.id}`);
        if (res.ok) {
          const data = await res.json();
          setCrowdPct(data.score?.approval_pct ?? null);
        }
      } catch {
        setCrowdPct(null);
      }
    }, 800);
  };

  const handleNext = () => fetchDaily();

  const tracks = dailyData?.tracks ?? [];
  const playlist = dailyData?.playlist ?? null;

  const { currentTrack, nextTrack, thirdTrack, currentIndex, total, progress, streak, dopamineEvent, vote } =
    useVoteSession({
      tracks,
      playlistId: playlist?.id ?? "",
      onComplete: handleComplete,
    });

  const itunesPreviews = useItunesPreviews(tracks, currentIndex);
  const keptCount = voteResults.filter((r) => r.vote).length;
  const removedCount = voteResults.filter((r) => !r.vote).length;
  const progressPct = Math.round(progress * 100);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#22E05A33", borderTopColor: "#22E05A" }}
        />
      </div>
    );
  }

  if (dailyData?.done) {
    const message = dailyData.weekComplete
      ? "You finished the whole week."
      : dailyData.comeBackTomorrow
      ? "Done for today."
      : "No playlists yet this week.";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p className="text-5xl mb-1">{dailyData.weekComplete ? "🏆" : "🎵"}</p>
        <p className="text-white font-black text-xl" style={{ letterSpacing: "-0.02em" }}>{message}</p>
        {dailyData.comeBackTomorrow && (
          <p className="text-sm" style={{ color: "#555" }}>Your streak is safe. See you tomorrow.</p>
        )}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          <button
            onClick={() => router.push("/leaderboard")}
            className="py-3.5 rounded-2xl font-black text-sm"
            style={{ background: "linear-gradient(135deg, #22E05A, #17b549)", color: "#080808", boxShadow: "0 4px 20px rgba(34,224,90,0.25)" }}
          >
            View leaderboard →
          </button>
          <button
            onClick={() => router.push("/submit")}
            className="py-3.5 rounded-2xl font-semibold text-sm transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Submit your playlist
          </button>
          <button
            onClick={() => router.push("/nominations")}
            className="text-xs transition-colors"
            style={{ color: "#444" }}
          >
            Vote on nominations →
          </button>
        </div>
      </motion.div>
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
    <main className="min-h-screen flex flex-col max-w-md mx-auto px-4 py-5 pb-24 relative">
      <motion.div
        className="flex items-center justify-between mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm" style={{ letterSpacing: "-0.01em" }}>
            {dailyData?.totalThisWeek
              ? `${(dailyData.doneThisWeek ?? 0) + 1} of ${dailyData.totalThisWeek} this week`
              : "Now playing"}
          </p>
        </div>
        <UserMenu />
      </motion.div>

      <div className="mb-3 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #22E05A, #17b549)" }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="mb-3">
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
              disabled={loading}
            />
          )}
        </AnimatePresence>
        <DopamineOverlay event={dopamineEvent} />
      </div>

      <div className="mt-6">
        <ActionButtons
          onRemove={() => stackRef.current?.swipe("remove")}
          onKeep={() => stackRef.current?.swipe("keep")}
          disabled={!currentTrack || loading}
        />
      </div>
      <BottomNav />
    </main>
  );
}
