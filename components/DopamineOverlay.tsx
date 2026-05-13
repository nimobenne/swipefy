"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DopamineEvent } from "@/types";

interface DopamineOverlayProps {
  event: DopamineEvent;
}

const events: Record<
  NonNullable<DopamineEvent>,
  { emoji: string; label: string; color: string; bg: string }
> = {
  keep: { emoji: "💚", label: "", color: "#1DB954", bg: "rgba(29,185,84,0.1)" },
  remove: { emoji: "🚫", label: "", color: "#E91E8C", bg: "rgba(233,30,140,0.1)" },
  "on-fire": { emoji: "🔥", label: "On Fire!", color: "#FF6B35", bg: "rgba(255,107,53,0.15)" },
  confetti: { emoji: "🎉", label: "5 in a row!", color: "#1DB954", bg: "rgba(29,185,84,0.15)" },
  legendary: { emoji: "👑", label: "Legendary Taste!", color: "#FFD700", bg: "rgba(255,215,0,0.15)" },
  "spring-clean": { emoji: "🧹", label: "Spring Cleaning!", color: "#E91E8C", bg: "rgba(233,30,140,0.15)" },
};

export default function DopamineOverlay({ event }: DopamineOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (event === "confetti" || event === "legendary") {
      import("canvas-confetti").then((mod) => {
        const confetti = mod.default;
        confetti({
          particleCount: event === "legendary" ? 200 : 100,
          spread: 70,
          origin: { y: 0.6 },
          colors:
            event === "legendary"
              ? ["#FFD700", "#FFA500", "#FF6B35", "#1DB954"]
              : ["#1DB954", "#ffffff", "#17a349"],
        });
      });
    }
  }, [event]);

  if (!event || event === "keep" || event === "remove") {
    return null;
  }

  const cfg = events[event];

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div
            className="rounded-2xl px-8 py-5 flex flex-col items-center gap-1 backdrop-blur-sm"
            style={{ background: cfg.bg, border: `2px solid ${cfg.color}33` }}
          >
            <span className="text-6xl">{cfg.emoji}</span>
            {cfg.label && (
              <span
                className="text-2xl font-black tracking-tight"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
