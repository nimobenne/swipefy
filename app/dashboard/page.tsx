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
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-black">
            Swipe<span style={{ color: "#1DB954" }}>fy</span>
          </h1>
          <p className="text-subtext text-sm mt-0.5">
            Pick a playlist to curate
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-subtext text-sm hover:text-white transition-colors"
        >
          Sign out
        </button>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-remove/10 border border-remove/20 text-remove text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      <PlaylistGrid
        playlists={playlists}
        onSelect={handleSelect}
        loading={loading}
      />

      {!loading && playlists.length === 0 && !error && (
        <div className="text-center py-20 text-subtext">
          <p className="text-4xl mb-3">🎵</p>
          <p className="font-semibold">No playlists found</p>
          <p className="text-sm mt-1 opacity-60">
            Create a playlist on Spotify first
          </p>
        </div>
      )}
    </main>
  );
}
