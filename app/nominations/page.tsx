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
            n.id === id ? { ...n, vote_count: n.vote_count + (data.voted ? 1 : -1) } : n
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
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#22E05A33", borderTopColor: "#22E05A" }}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 pb-28 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1
              className="text-white font-black mb-0.5"
              style={{ fontSize: "26px", letterSpacing: "-0.03em" }}
            >
              Nominations
            </h1>
            <p className="text-sm" style={{ color: "#555" }}>Vote for playlists you want next week.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/nominate")}
              className="px-4 py-2 rounded-xl font-black text-xs flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #22E05A, #17b549)",
                color: "#080808",
                boxShadow: "0 2px 12px rgba(34,224,90,0.25)",
              }}
            >
              + Nominate
            </button>
            <UserMenu />
          </div>
        </div>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(240,36,143,0.08)", border: "1px solid rgba(240,36,143,0.2)", color: "#F0248F" }}
          >
            {error}
          </div>
        )}

        {nominations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎵</p>
            <p className="text-white font-bold">No nominations yet</p>
            <p className="text-sm mt-1 mb-6" style={{ color: "#555" }}>Be the first to nominate.</p>
            <button
              onClick={() => router.push("/nominate")}
              className="px-6 py-3 rounded-2xl font-black text-sm"
              style={{ background: "linear-gradient(135deg, #22E05A, #17b549)", color: "#080808" }}
            >
              Nominate a playlist
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {nominations.map((n, i) => {
              const voted = userVotes.has(n.id);
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24, delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate" style={{ letterSpacing: "-0.01em" }}>{n.pitch}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#555" }}>by {n.submitted_name}</p>
                    <a
                      href={n.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline mt-0.5 block truncate"
                      style={{ color: "#22E05A" }}
                    >
                      {n.spotify_url.replace("https://open.spotify.com/playlist/", "spotify:playlist:")}
                    </a>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleVote(n.id)}
                    disabled={voting === n.id}
                    className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-black transition-all flex-shrink-0"
                    style={
                      voted
                        ? { background: "linear-gradient(135deg, #22E05A, #17b549)", color: "#080808" }
                        : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }
                    }
                  >
                    <span>{voted ? "▲" : "△"}</span>
                    <span>{n.vote_count}</span>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
      <BottomNav />
    </main>
  );
}
