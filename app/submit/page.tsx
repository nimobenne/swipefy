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
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = url.trim().split("?")[0].split("#")[0];
    if (!clean) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error — try again");
      setSubmitting(false);
    }
  };

  if (status === "loading" || active === undefined) {
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
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => router.push("/discover")}
          className="flex items-center gap-1 text-sm mb-7 transition-colors"
          style={{ color: "#555" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {active && !swapping ? (
          <>
            <h1 className="text-white font-black mb-0.5" style={{ fontSize: "26px", letterSpacing: "-0.03em" }}>
              Your playlist
            </h1>
            <p className="text-sm mb-6" style={{ color: "#555" }}>In the pool, collecting votes.</p>

            <div
              className="flex items-center gap-4 p-4 rounded-2xl mb-6"
              style={{ background: "rgba(34,224,90,0.04)", border: "1px solid rgba(34,224,90,0.15)" }}
            >
              {active.cover_url ? (
                <img src={active.cover_url} alt={active.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  🎵
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate" style={{ letterSpacing: "-0.01em" }}>{active.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#555" }}>{active.track_count} tracks</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="py-3.5 rounded-2xl font-black text-sm"
                style={{ background: "linear-gradient(135deg, #22E05A, #17b549)", color: "#080808", boxShadow: "0 4px 20px rgba(34,224,90,0.25)" }}
              >
                See your score →
              </button>
              <button
                onClick={() => setSwapping(true)}
                className="py-3.5 rounded-2xl font-semibold text-sm transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Swap to a different playlist
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-white font-black mb-0.5" style={{ fontSize: "26px", letterSpacing: "-0.03em" }}>
              {swapping ? "Swap playlist" : "Submit your playlist"}
            </h1>
            <p className="text-sm mb-6" style={{ color: "#555" }}>
              {swapping
                ? "Your current playlist will be replaced."
                : "Paste a public Spotify link. Strangers rate every track."}
            </p>

            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(240,36,143,0.08)", border: "1px solid rgba(240,36,143,0.2)", color: "#F0248F" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full px-4 py-3.5 rounded-2xl text-white text-sm focus:outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  // @ts-ignore
                  "--tw-ring-color": "#22E05A",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(34,224,90,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                disabled={submitting}
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting || !url.trim()}
                className="py-3.5 rounded-2xl font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #22E05A, #17b549)", color: "#080808", boxShadow: "0 4px 20px rgba(34,224,90,0.25)" }}
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
                  className="py-3.5 rounded-2xl font-semibold text-sm transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#555" }}
                >
                  Cancel
                </button>
              )}
            </form>

            <p className="text-xs mt-5 text-center" style={{ color: "#444" }}>
              Playlist must be public on Spotify.
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}
