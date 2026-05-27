"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UserMenu from "@/components/UserMenu";

export default function NominatePage() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pitch, setPitch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !pitch.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyUrl: url.trim(), pitch: pitch.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-4xl">🎉</p>
        <p className="text-white font-bold text-lg">Nomination submitted!</p>
        <p className="text-subtext text-sm">Others can now upvote it. Top nominations get added next week.</p>
        <button
          onClick={() => router.push("/nominations")}
          className="mt-4 px-6 py-3 rounded-2xl bg-spotify-green text-black font-black text-sm"
        >
          See all nominations →
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/nominations")}
            className="text-subtext hover:text-white transition-colors flex items-center gap-1 text-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <UserMenu />
        </div>

        <h1 className="text-white text-2xl font-black mb-1">Nominate a playlist</h1>
        <p className="text-subtext text-sm mb-6">
          One nomination per week. Top voted nominations get added to next week&apos;s pool.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-subtext text-xs uppercase tracking-wider mb-2 block">
              Spotify playlist URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-subtext text-sm focus:outline-none focus:border-spotify-green transition-colors"
              disabled={submitting}
              autoFocus
            />
          </div>
          <div>
            <label className="text-subtext text-xs uppercase tracking-wider mb-2 block">
              One-line pitch ({120 - pitch.length} chars left)
            </label>
            <input
              type="text"
              value={pitch}
              onChange={(e) => setPitch(e.target.value.slice(0, 120))}
              placeholder="e.g. deep focus beats for late nights"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-subtext text-sm focus:outline-none focus:border-spotify-green transition-colors"
              disabled={submitting}
              maxLength={120}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !url.trim() || !pitch.trim()}
            className="py-3 rounded-2xl bg-spotify-green text-black font-black text-sm hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                Submitting…
              </>
            ) : (
              "Nominate playlist"
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
