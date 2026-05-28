"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UserMenu from "@/components/UserMenu";
import BottomNav from "@/components/BottomNav";
import type { LeaderboardEntry } from "@/app/api/leaderboard/route";

export default function LeaderboardPage() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [week, setWeek] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.playlists ?? []);
        setWeek(d.week ?? "");
      })
      .finally(() => setLoading(false));
  }, [status]);

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

  const rankedEntries = entries.filter((e) => e.ranked);
  const unrankedEntries = entries.filter((e) => !e.ranked);

  return (
    <main className="min-h-screen px-5 py-8 pb-28 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/discover")}
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: "#555" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <UserMenu />
        </div>

        <h1
          className="text-white font-black mb-0.5"
          style={{ fontSize: "28px", letterSpacing: "-0.03em" }}
        >
          This week
        </h1>
        {week && (
          <p className="text-sm mb-7" style={{ color: "#555" }}>Week of {week}</p>
        )}

        {entries.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎵</p>
            <p className="text-white font-bold text-lg">No playlists yet</p>
            <p className="text-sm mt-1" style={{ color: "#555" }}>Check back after some votes come in.</p>
          </div>
        )}

        {rankedEntries.length > 0 && (
          <div className="flex flex-col gap-3 mb-8">
            {rankedEntries.map((entry, i) => (
              <LeaderboardCard key={entry.id} entry={entry} rank={i + 1} index={i} />
            ))}
          </div>
        )}

        {unrankedEntries.length > 0 && (
          <>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "#444" }}
            >
              Needs more votes
            </p>
            <div className="flex flex-col gap-2">
              {unrankedEntries.map((entry, i) => (
                <LeaderboardCard key={entry.id} entry={entry} rank={null} index={rankedEntries.length + i} />
              ))}
            </div>
          </>
        )}
      </motion.div>
      <BottomNav />
    </main>
  );
}

function LeaderboardCard({ entry, rank, index }: { entry: LeaderboardEntry; rank: number | null; index: number }) {
  const votesNeeded = rank === null ? Math.max(0, 50 - entry.total_votes) : 0;
  const isFirst = rank === 1;

  const barColor =
    entry.approval_pct >= 80
      ? "linear-gradient(90deg, #22E05A, #17b549)"
      : entry.approval_pct >= 50
      ? "linear-gradient(90deg, #FF9800, #e68900)"
      : "linear-gradient(90deg, #F0248F, #c0196e)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.055 }}
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{
        background: isFirst ? "rgba(34,224,90,0.05)" : "rgba(255,255,255,0.04)",
        border: isFirst ? "1px solid rgba(34,224,90,0.2)" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: isFirst ? "0 0 30px rgba(34,224,90,0.06)" : "none",
      }}
    >
      {rank !== null && (
        <span
          className="text-sm font-black w-7 text-center flex-shrink-0"
          style={{ color: isFirst ? "#22E05A" : "#444" }}
        >
          {isFirst ? "👑" : `#${rank}`}
        </span>
      )}

      {entry.cover_url ? (
        <img
          src={entry.cover_url}
          alt={entry.name}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          style={{ boxShadow: isFirst ? "0 0 16px rgba(34,224,90,0.25)" : "none" }}
        />
      ) : (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          🎵
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate" style={{ letterSpacing: "-0.01em" }}>
          {entry.name}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: "#555" }}>
          by {entry.owner_display_name}
        </p>

        {rank !== null ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${entry.approval_pct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: index * 0.055 + 0.3 }}
                style={{ background: barColor }}
              />
            </div>
            <span className="text-xs font-bold flex-shrink-0" style={{ color: "rgba(255,255,255,0.85)" }}>
              {entry.approval_pct}%
            </span>
          </div>
        ) : (
          <p className="text-xs mt-1" style={{ color: "#444" }}>
            {entry.total_votes} votes · {votesNeeded} more to rank
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {rank !== null && (
          <p className="text-xs" style={{ color: "#444" }}>{entry.total_votes} votes</p>
        )}
        {entry.spotify_url && (
          <a
            href={entry.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-opacity hover:opacity-80"
            style={{
              background: "linear-gradient(135deg, #22E05A, #17b549)",
              color: "#080808",
            }}
          >
            Listen →
          </a>
        )}
      </div>
    </motion.div>
  );
}
