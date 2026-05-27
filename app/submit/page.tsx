"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

interface ActivePlaylist {
  id: string;
  name: string;
  cover_url: string | null;
  track_count: number;
}

export default function SubmitPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [active, setActive] = useState<ActivePlaylist | null | undefined>(undefined);
  const [swapping, setSwapping] = useState(false);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const p = new URLSearchParams(window.location.search).get("error");
    return p ? `Spotify error: ${p.replace(/_/g, " ")}` : null;
  });

  useEffect(() => {
    if (status !== "authenticated" || !session?.userId) return;
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
    );
    sb.from("public_playlists")
      .select("id, name, cover_url, track_count")
      .eq("owner_id", session.userId)
      .eq("is_active", true)
      .single()
      .then(({ data }) => setActive(data ?? null));
  }, [status, session?.userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = url.trim().split("?")[0].split("#")[0];
    if (!clean) return;
    setSubmitting(true);
    setError(null);
    window.location.href = `/api/spotify-auth?playlist_url=${encodeURIComponent(clean)}`;
  };

  if (status === "loading" || active === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => router.push("/discover")}
          className="text-subtext hover:text-white transition-colors mb-6 flex items-center gap-1 text-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {active && !swapping ? (
          <>
            <h1 className="text-white text-2xl font-black mb-1">Your playlist</h1>
            <p className="text-subtext text-sm mb-6">Already in the pool and collecting votes.</p>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
              {active.cover_url ? (
                <img src={active.cover_url} alt={active.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">🎵</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{active.name}</p>
                <p className="text-subtext text-xs mt-0.5">{active.track_count} tracks</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="py-3 rounded-2xl bg-spotify-green text-black font-black text-sm hover:bg-green-400 transition-colors"
              >
                See your score →
              </button>
              <button
                onClick={() => setSwapping(true)}
                className="py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-colors"
              >
                Swap to a different playlist
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-white text-2xl font-black mb-1">
              {swapping ? "Swap playlist" : "Submit your playlist"}
            </h1>
            <p className="text-subtext text-sm mb-6">
              {swapping
                ? "Your current playlist will be replaced. Paste the new one below."
                : "Paste a public Spotify playlist link. Strangers rate every track. You get a live approval score."}
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-remove/10 border border-remove/30 text-remove text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-subtext text-sm focus:outline-none focus:border-spotify-green transition-colors"
                disabled={submitting}
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting || !url.trim()}
                className="py-3 rounded-2xl bg-spotify-green text-black font-black text-sm hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    Submitting…
                  </>
                ) : (
                  swapping ? "Swap playlist" : "Submit playlist"
                )}
              </button>
              {swapping && (
                <button
                  type="button"
                  onClick={() => { setSwapping(false); setError(null); setUrl(""); }}
                  className="py-3 rounded-2xl bg-white/5 text-subtext font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              )}
            </form>

            <p className="text-subtext text-xs mt-4 text-center">
              The playlist must be public on Spotify.
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}
