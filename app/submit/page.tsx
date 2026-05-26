"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SpotifyPlaylist } from "@/types";

export default function SubmitPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((d) => setPlaylists(d.playlists ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const handleSubmit = async (playlist: SpotifyPlaylist) => {
    setSubmitting(playlist.id);
    setError(null);
    try {
      const res = await fetch("/api/playlists/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyPlaylistId: playlist.id,
          name: playlist.name,
          coverUrl: playlist.images[0]?.url ?? null,
          trackCount: playlist.tracks.total,
          ownerDisplayName: session?.user?.name ?? "Anonymous",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
      setSubmitting(null);
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
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => router.push("/discover")}
          className="text-subtext hover:text-white transition-colors mb-4 flex items-center gap-1 text-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <h1 className="text-white text-2xl font-black">Submit your playlist</h1>
        <p className="text-subtext text-sm mt-1">
          One playlist enters the pool. Strangers rate every track. You get a live approval score.
        </p>
      </motion.div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-remove/10 border border-remove/30 text-remove text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {playlists.map((p) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleSubmit(p)}
            disabled={submitting !== null}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left disabled:opacity-50"
          >
            {p.images[0] ? (
              <img src={p.images[0].url} alt={p.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">🎵</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{p.name}</p>
              <p className="text-subtext text-xs mt-0.5">{p.tracks.total} tracks</p>
            </div>
            {submitting === p.id ? (
              <div className="w-5 h-5 rounded-full border-2 border-spotify-green border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-subtext flex-shrink-0">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </motion.button>
        ))}
      </div>
    </main>
  );
}
