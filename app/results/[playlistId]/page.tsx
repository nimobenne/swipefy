"use client";
import { use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

interface PageProps {
  params: Promise<{ playlistId: string }>;
}

const stat = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.15, type: "spring", stiffness: 200, damping: 18 },
  }),
};

export default function ResultsPage({ params }: PageProps) {
  const { playlistId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const kept = Number(searchParams.get("kept") ?? 0);
  const removed = Number(searchParams.get("removed") ?? 0);
  const playlistName = searchParams.get("name") ?? "your playlist";
  const total = kept + removed;
  const keptPct = total > 0 ? Math.round((kept / total) * 100) : 0;

  // Confetti on load
  useEffect(() => {
    import("canvas-confetti").then((mod) => {
      const confetti = mod.default;
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.3 },
          colors: ["#1DB954", "#17a349", "#ffffff"],
        });
      }, 500);
    });
  }, []);

  const getMessage = () => {
    if (keptPct >= 80) return { emoji: "🎵", text: "Curated with love!" };
    if (keptPct >= 50) return { emoji: "✨", text: "Nice clean-up!" };
    if (keptPct >= 30) return { emoji: "🧹", text: "Spring cleaned!" };
    return { emoji: "🔥", text: "Ruthless curator!" };
  };

  const { emoji, text } = getMessage();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10 max-w-sm mx-auto">
      {/* Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-6xl mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {emoji}
        </motion.div>
        <h1 className="text-3xl font-black">{text}</h1>
        <p className="text-subtext text-sm mt-2">
          You curated{" "}
          <span className="text-white font-semibold">
            {playlistName}
          </span>
        </p>
      </motion.div>

      {/* Stats */}
      <div className="w-full grid grid-cols-2 gap-4 mb-8">
        <motion.div
          custom={0}
          variants={stat}
          initial="hidden"
          animate="show"
          className="rounded-2xl p-5 flex flex-col items-center gap-1"
          style={{ background: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.25)" }}
        >
          <span className="text-4xl font-black text-spotify-green">{kept}</span>
          <span className="text-subtext text-sm font-medium">Kept</span>
          <div className="flex items-center gap-1 mt-1">
            <svg viewBox="0 0 24 24" fill="#1DB954" className="w-4 h-4">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="text-spotify-green text-xs font-semibold">{keptPct}%</span>
          </div>
        </motion.div>

        <motion.div
          custom={1}
          variants={stat}
          initial="hidden"
          animate="show"
          className="rounded-2xl p-5 flex flex-col items-center gap-1"
          style={{ background: "rgba(233,30,140,0.12)", border: "1px solid rgba(233,30,140,0.25)" }}
        >
          <span className="text-4xl font-black text-remove">{removed}</span>
          <span className="text-subtext text-sm font-medium">Removed</span>
          <div className="flex items-center gap-1 mt-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="text-remove text-xs font-semibold">{100 - keptPct}%</span>
          </div>
        </motion.div>
      </div>

      {/* Clean-up bar */}
      <motion.div
        className="w-full mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex justify-between text-xs text-subtext mb-2">
          <span>Kept</span>
          <span>Removed</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #1DB954, #E91E8C)" }}
            initial={{ width: 0 }}
            animate={{ width: `${keptPct}%` }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        className="w-full flex flex-col gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            router.push(
              `/swipe/${playlistId}?name=${encodeURIComponent(playlistName)}`
            )
          }
          className="w-full py-4 rounded-2xl font-bold text-black"
          style={{ background: "linear-gradient(135deg, #1DB954, #17a349)" }}
        >
          Swipe again
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/dashboard")}
          className="w-full py-4 rounded-2xl font-bold text-white"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          Pick another playlist
        </motion.button>
      </motion.div>
    </main>
  );
}
