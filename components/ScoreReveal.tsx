"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PublicPlaylist } from "@/lib/supabase";
import type { TrackVoteResult } from "@/types";

interface ScoreRevealProps {
  playlist: PublicPlaylist;
  results: TrackVoteResult[];
  crowdPct: number | null;
  onNext: () => void;
}

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    const start = performance.now();
    const raf = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return count;
}

function scoreColor(pct: number) {
  if (pct >= 70) return "#22E05A";
  if (pct >= 40) return "#FF9800";
  return "#F0248F";
}

export default function ScoreReveal({ playlist, results, crowdPct, onNext }: ScoreRevealProps) {
  const yourPct =
    results.length > 0
      ? Math.round((results.filter((r) => r.vote).length / results.length) * 100)
      : 0;

  const yourCount = useCountUp(yourPct, 800);
  const crowdCount = useCountUp(crowdPct ?? 0, 1000);

  useEffect(() => {
    if (yourPct >= 70) {
      const colors = yourPct >= 90
        ? ["#22E05A", "#ffffff", "#22E05A"]
        : ["#22E05A", "#ffffff", "#F0248F"];
      import("canvas-confetti").then((m) =>
        m.default({
          particleCount: yourPct >= 90 ? 160 : 100,
          spread: 80,
          origin: { y: 0.55 },
          colors,
        })
      );
    }
  }, [yourPct]);

  useEffect(() => {
    if (crowdPct !== null && crowdPct >= 90) {
      setTimeout(() => {
        import("canvas-confetti").then((m) =>
          m.default({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#22E05A", "#ffffff"],
          })
        );
      }, 400);
    }
  }, [crowdPct]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 max-w-md mx-auto"
    >
      {playlist.cover_url && (
        <motion.img
          src={playlist.cover_url}
          alt={playlist.name}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-28 h-28 rounded-2xl object-cover mb-5 shadow-2xl"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
        />
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm mb-8"
        style={{ color: "#8A8A8A" }}
      >
        Your votes
      </motion.p>

      <div className="flex gap-8 mb-10 w-full justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.35 }}
          className="flex flex-col items-center gap-2"
        >
          <span
            className="text-5xl font-black tabular-nums"
            style={{ color: scoreColor(yourPct), textShadow: `0 0 30px ${scoreColor(yourPct)}60`, letterSpacing: "-0.03em" }}
          >
            {yourCount}%
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#555" }}>You gave</span>
        </motion.div>

        <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.45 }}
          className="flex flex-col items-center gap-2"
        >
          <AnimatePresence mode="wait">
            {crowdPct !== null ? (
              <motion.span
                key="crowd-score"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-black tabular-nums"
                style={{ color: scoreColor(crowdPct), textShadow: `0 0 30px ${scoreColor(crowdPct)}60`, letterSpacing: "-0.03em" }}
              >
                {crowdCount}%
              </motion.span>
            ) : (
              <motion.div
                key="crowd-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#22E05A33", borderTopColor: "#22E05A" }}
              />
            )}
          </AnimatePresence>
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#555" }}>
            {crowdPct !== null ? "Crowd gives" : "Crowd..."}
          </span>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        whileTap={{ scale: 0.96 }}
        onClick={onNext}
        className="w-full py-4 rounded-2xl font-black text-sm tracking-wide"
        style={{
          background: "linear-gradient(135deg, #22E05A, #17b549)",
          color: "#080808",
          boxShadow: "0 4px 24px rgba(34,224,90,0.3)",
        }}
      >
        Next Playlist →
      </motion.button>
    </motion.div>
  );
}
