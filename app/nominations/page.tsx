"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UserMenu from "@/components/UserMenu";
import BottomNav from "@/components/BottomNav";

interface Nomination {
  id: string;
  spotify_url: string;
  pitch: string;
  submitted_name: string;
  submitted_at: string;
  vote_count: number;
}

export default function NominationsPage() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNominations = async () => {
    try {
      const res = await fetch("/api/nominations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setNominations(data.nominations ?? []);
      setUserVotes(new Set(data.userVotes ?? []));
    } catch (err) {
      setError(String(err));
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchNominations().finally(() => setLoading(false));
  }, [status]);

  const handleVote = async (id: string) => {
    if (voting) return;
    setVoting(id);
    try {
      const res = await fetch(`/api/nominations/${id}/vote`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNominations((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, vote_count: n.vote_count + (data.voted ? 1 : -1) }
              : n
          )
        );
        setUserVotes((prev) => {
          const next = new Set(prev);
          if (data.voted) next.add(id);
          else next.delete(id);
          return next;
        });
      } else {
        setError("Vote failed. Try again.");
      }
    } finally {
      setVoting(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 pb-24 max-w-2xl mx-auto">
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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-black mb-1">This week&apos;s nominations</h1>
            <p className="text-subtext text-sm">Vote for playlists you want to hear next week.</p>
          </div>
          <button
            onClick={() => router.push("/nominate")}
            className="px-4 py-2 rounded-xl bg-spotify-green text-black font-black text-xs hover:bg-green-400 transition-colors flex-shrink-0"
          >
            + Nominate
          </button>
        </div>

        {nominations.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎵</p>
            <p className="text-white font-bold">No nominations yet this week</p>
            <p className="text-subtext text-sm mt-1">Be the first to nominate a playlist.</p>
            <button
              onClick={() => router.push("/nominate")}
              className="mt-6 px-6 py-3 rounded-2xl bg-spotify-green text-black font-black text-sm"
            >
              Nominate a playlist
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {nominations.map((n) => {
            const voted = userVotes.has(n.id);
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{n.pitch}</p>
                  <p className="text-subtext text-xs mt-0.5">by {n.submitted_name}</p>
                  <a
                    href={n.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-spotify-green text-xs hover:underline mt-0.5 block truncate"
                  >
                    {n.spotify_url.replace("https://open.spotify.com/playlist/", "spotify:playlist:")}
                  </a>
                </div>
                <button
                  onClick={() => handleVote(n.id)}
                  disabled={voting === n.id}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-black transition-colors flex-shrink-0 ${
                    voted
                      ? "bg-spotify-green text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <span>{voted ? "▲" : "△"}</span>
                  <span>{n.vote_count}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      <BottomNav />
    </main>
  );
}
