"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { SpotifyPlaylist } from "@/types";

interface PlaylistGridProps {
  playlists: SpotifyPlaylist[];
  onSelect: (playlist: SpotifyPlaylist) => void;
  loading?: boolean;
  currentUserId?: string;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 22 } },
};

function LikedSongsArt() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #450af5, #c4efd9)" }}
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-12 h-12 drop-shadow-lg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  );
}

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
        const isLiked = playlist.id === "liked";
        const trackCount = playlist.tracks?.total ?? 0;

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
            {isLiked ? (
              <LikedSongsArt />
            ) : img ? (
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-bold text-sm leading-tight line-clamp-2">
                {playlist.name}
              </p>
              <p className="text-white/60 text-xs mt-0.5 font-medium">
                {trackCount > 0 ? `${trackCount.toLocaleString()} tracks` : "Empty"}
              </p>
              {!isLiked && playlist.owner?.display_name && (
                <p className="text-white/35 text-[10px] mt-0.5 truncate">
                  {playlist.owner.display_name}
                </p>
              )}
            </div>

            {/* Hover glow */}
            <div className="absolute inset-0 rounded-2xl border border-spotify-green/0 group-hover:border-spotify-green/40 transition-colors duration-200" />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
