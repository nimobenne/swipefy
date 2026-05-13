"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { SpotifyPlaylist } from "@/types";

interface PlaylistGridProps {
  playlists: SpotifyPlaylist[];
  onSelect: (playlist: SpotifyPlaylist) => void;
  loading?: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 22 } },
};

export default function PlaylistGrid({ playlists, onSelect, loading }: PlaylistGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden bg-white/5 animate-pulse"
            style={{ aspectRatio: "1" }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {playlists.map((playlist) => {
        const img = playlist.images?.[0]?.url;
        return (
          <motion.button
            key={playlist.id}
            variants={item}
            onClick={() => onSelect(playlist)}
            className="group relative rounded-2xl overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green"
            style={{ aspectRatio: "1" }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {img ? (
              <Image
                src={img}
                alt={playlist.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="#1DB954" className="w-10 h-10 opacity-40">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-bold text-sm leading-tight line-clamp-2">
                {playlist.name}
              </p>
              <p className="text-white/50 text-xs mt-0.5">
                {playlist.tracks.total} tracks
              </p>
            </div>

            {/* Hover glow */}
            <div className="absolute inset-0 rounded-2xl border border-spotify-green/0 group-hover:border-spotify-green/40 transition-colors duration-200" />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
