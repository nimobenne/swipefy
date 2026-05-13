"use client";
import { motion, AnimatePresence } from "framer-motion";
import { StreakState } from "@/types";

interface StreakCounterProps {
  streak: StreakState;
  kept: number;
  removed: number;
  total: number;
}

export default function StreakCounter({ streak, kept, removed, total }: StreakCounterProps) {
  const showStreak = streak.count >= 3;

  return (
    <div className="flex items-center justify-between w-full px-1">
      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-spotify-green" />
          <span className="text-subtext text-sm font-medium">{kept} kept</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-remove" />
          <span className="text-subtext text-sm font-medium">{removed} removed</span>
        </div>
      </div>

      {/* Streak badge */}
      <AnimatePresence mode="wait">
        {showStreak && (
          <motion.div
            key={`${streak.type}-${streak.count}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              background:
                streak.type === "keep"
                  ? "rgba(29,185,84,0.2)"
                  : "rgba(233,30,140,0.2)",
              border: `1px solid ${streak.type === "keep" ? "#1DB954" : "#E91E8C"}40`,
            }}
          >
            <span className="text-sm">
              {streak.type === "keep" ? "🔥" : "💨"}
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: streak.type === "keep" ? "#1DB954" : "#E91E8C" }}
            >
              {streak.count}x streak
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
