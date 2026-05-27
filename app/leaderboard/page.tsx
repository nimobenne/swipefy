"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UserMenu from "@/components/UserMenu";
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
        <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
      </div>
    );
  }

  const rankedEntries = entries.filter((e) => e.ranked);
  const unrankedEntries = entries.filter((e) => !e.ranked);

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/discover")}
            className="text-subtext hover:text-white transition-colors flex items-center gap-1 text-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <UserMenu />
        </div>

        <h1 className="text-white text-2xl font-black mb-1">This week&apos;s leaderboard</h1>
        {week && (
          <p className="text-subtext text-sm mb-6">Week of {week}</p>
        )}

        {entries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎵</p>
            <p className="text-white font-bold">No playlists this week yet</p>
            <p className="text-subtext text-sm mt-1">Check back after some votes come in.</p>
          </div>
        )}

        {rankedEntries.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            {rankedEntries.map((entry, i) => (
              <LeaderboardCard key={entry.id} entry={entry} rank={i + 1} />
            ))}
          </div>
        )}

        {unrankedEntries.length > 0 && (
          <>
            <p className="text-subtext text-xs uppercase tracking-wider mb-3">
              Needs more votes to rank
            </p>
            <div className="flex flex-col gap-3">
              {unrankedEntries.map((entry) => (
                <LeaderboardCard key={entry.id} entry={entry} rank={null} />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
}

function LeaderboardCard({ entry, rank }: { entry: LeaderboardEntry; rank: number | null }) {
  const votesNeeded = rank === null ? Math.max(0, 50 - entry.total_votes) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
    >
      {rank !== null && (
        <span className="text-subtext text-sm font-black w-6 text-center flex-shrink-0">
          #{rank}
        </span>
      )}
      {entry.cover_url ? (
        <img
          src={entry.cover_url}
          alt={entry.name}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
          🎵
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{entry.name}</p>
        <p className="text-subtext text-xs">by {entry.owner_display_name}</p>
        {rank !== null ? (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${entry.approval_pct}%`,
                  background: entry.approval_pct >= 80
                    ? "linear-gradient(90deg, #1DB954, #17a349)"
                    : entry.approval_pct >= 50
                    ? "linear-gradient(90deg, #FF9800, #e68900)"
                    : "linear-gradient(90deg, #E91E8C, #c0196e)",
                }}
              />
            </div>
            <span className="text-white text-xs font-bold flex-shrink-0">
              {entry.approval_pct}%
            </span>
          </div>
        ) : (
          <p className="text-subtext text-xs mt-0.5">
            {entry.total_votes} votes · needs {votesNeeded} more to rank
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {rank !== null && (
          <p className="text-subtext text-xs">{entry.total_votes} votes</p>
        )}
        {entry.spotify_url && (
          <a
            href={entry.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-spotify-green text-black text-xs font-black hover:bg-green-400 transition-colors whitespace-nowrap"
          >
            Listen →
          </a>
        )}
      </div>
    </motion.div>
  );
}
