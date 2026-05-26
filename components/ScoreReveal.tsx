"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import type { PublicPlaylist } from "@/lib/supabase";
import type { TrackVoteResult } from "@/types";

interface ScoreRevealProps {
  playlist: PublicPlaylist;
  results: TrackVoteResult[];
  crowdPct: number | null;
  onNext: () => void;
}

export default function ScoreReveal({ playlist, results, crowdPct, onNext }: ScoreRevealProps) {
  const yourPct =
    results.length > 0
      ? Math.round((results.filter((r) => r.vote).length / results.length) * 100)
      : 0;

  useEffect(() => {
    if (crowdPct !== null && crowdPct >= 90) {
      import("canvas-confetti").then((m) =>
        m.default({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#1DB954", "#ffffff"],
        })
      );
    }
  }, [crowdPct]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 max-w-md mx-auto"
    >
      {playlist.cover_url && (
        <img
          src={playlist.cover_url}
          alt={playlist.name}
          className="w-24 h-24 rounded-2xl object-cover mb-6 shadow-2xl"
        />
      )}
      <h2 className="text-white text-xl font-black text-center mb-1">{playlist.name}</h2>
      <p className="text-subtext text-sm mb-8">by {playlist.owner_display_name}</p>

      <div className="flex gap-6 mb-8">
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-4xl font-black"
            style={{
              color: yourPct >= 70 ? "#1DB954" : yourPct >= 40 ? "#FF9800" : "#E91E8C",
            }}
          >
            {yourPct}%
          </span>
          <span className="text-subtext text-xs uppercase tracking-widest">You gave</span>
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex flex-col items-center gap-1">
          {crowdPct !== null ? (
            <>
              <span
                className="text-4xl font-black"
                style={{
                  color: crowdPct >= 70 ? "#1DB954" : crowdPct >= 40 ? "#FF9800" : "#E91E8C",
                }}
              >
                {crowdPct}%
              </span>
              <span className="text-subtext text-xs uppercase tracking-widest">Crowd gives</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
              <span className="text-subtext text-xs uppercase tracking-widest">Crowd</span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-2xl bg-spotify-green text-black font-black text-sm tracking-wide hover:bg-green-400 transition-colors"
      >
        Next Playlist →
      </button>
    </motion.div>
  );
}
