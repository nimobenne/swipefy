"use client";
import Image from "next/image";
import { motion, MotionValue, useTransform, useMotionValue } from "framer-motion";
import { SpotifyTrack } from "@/types";
import AudioVisualizer from "./AudioVisualizer";

interface SongCardProps {
  track: SpotifyTrack;
  playing: boolean;
  progress: number;
  overlayX?: MotionValue<number>;
}

export default function SongCard({ track, playing, progress, overlayX }: SongCardProps) {
  const albumArt = track.album.images[0]?.url ?? null;
  const artist = track.artists.map((a) => a.name).join(", ");
  const hasPreview = !!track.preview_url;

  const fallbackX = useMotionValue(0);
  const effectiveX = overlayX ?? fallbackX;
  const keepOpacity = useTransform(effectiveX, [20, 110], [0, 1]);
  const removeOpacity = useTransform(effectiveX, [-110, -20], [1, 0]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl select-none bg-card-bg">
      {/* No-preview badge */}
      {!hasPreview && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 pointer-events-none">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white/50">
            <path d="M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73L19.73 21 21 19.73 4.27 3zM14 7h4V3h-6v5.18l2 2V7z" />
          </svg>
          <span className="text-white/50 text-[10px] font-semibold tracking-wide uppercase">No preview</span>
        </div>
      )}

      {/* Album Art */}
      {albumArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={albumArt}
          alt={track.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1DB954, #191414)" }} />
      )}

      {/* Dark gradient */}
      <div className="absolute inset-0 bg-card-gradient" />

      {/* KEEP overlay */}
      {overlayX && (
        <motion.div
          className="absolute inset-0 rounded-3xl flex items-start justify-end p-6 pointer-events-none"
          style={{
            opacity: keepOpacity,
            background: "rgba(29,185,84,0.15)",
            border: "3px solid #1DB954",
          }}
        >
          <div className="rotate-[-12deg] border-[3px] border-keep rounded-xl px-4 py-2 mt-2">
            <span className="text-keep font-black text-3xl tracking-widest drop-shadow">
              KEEP
            </span>
          </div>
        </motion.div>
      )}

      {/* REMOVE overlay */}
      {overlayX && (
        <motion.div
          className="absolute inset-0 rounded-3xl flex items-start justify-start p-6 pointer-events-none"
          style={{
            opacity: removeOpacity,
            background: "rgba(233,30,140,0.15)",
            border: "3px solid #E91E8C",
          }}
        >
          <div className="rotate-[12deg] border-[3px] border-remove rounded-xl px-4 py-2 mt-2">
            <span className="text-remove font-black text-3xl tracking-widest drop-shadow">
              NOPE
            </span>
          </div>
        </motion.div>
      )}

      {/* Bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
        {hasPreview && (
          <div className="mb-3">
            <div className="h-[2px] bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-spotify-green rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-[22px] leading-tight line-clamp-2 drop-shadow">
              {track.name}
            </h2>
            <p className="text-subtext text-[15px] font-semibold truncate mt-1">
              {artist}
            </p>
            <p className="text-white/35 text-[13px] truncate mt-0.5">
              {track.album.name}
            </p>
          </div>

          <div className="flex-shrink-0">
            {hasPreview ? (
              <AudioVisualizer playing={playing} />
            ) : (
              <span className="text-white/25 text-[11px]">No preview</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
