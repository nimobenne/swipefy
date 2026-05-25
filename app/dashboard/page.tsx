"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PlaylistGrid from "@/components/PlaylistGrid";
import { SpotifyPlaylist } from "@/types";

export default function Dashboard() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlaylists(data.playlists);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const handleSelect = (playlist: SpotifyPlaylist) => {
    router.push(`/swipe/${playlist.id}?name=${encodeURIComponent(playlist.name)}`);
  };

  const filtered = search.trim()
    ? playlists.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : playlists;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-black">
            Swipe<span style={{ color: "#1DB954" }}>fy</span>
          </h1>
          <p className="text-subtext text-sm mt-0.5">Pick a playlist to curate</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-subtext text-sm hover:text-white transition-colors"
        >
          Sign out
        </button>
      </motion.div>

      {/* Search */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search playlists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/8 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-spotify-green/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-remove/10 border border-remove/20 text-remove text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      <PlaylistGrid
        playlists={filtered}
        onSelect={handleSelect}
        loading={loading}
      />

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-20 text-subtext">
          {search ? (
            <>
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">No playlists match &ldquo;{search}&rdquo;</p>
            </>
          ) : (
            <>
              <p className="text-4xl mb-3">🎵</p>
              <p className="font-semibold">No playlists found</p>
              <p className="text-sm mt-1 opacity-60">Create a playlist on Spotify first</p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
