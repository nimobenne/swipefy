"use client";
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
    <div
      className="relative w-full h-full rounded-3xl overflow-hidden select-none"
      style={{ background: "#0E0E14" }}
    >
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
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #22E05A20, #F0248F20)" }} />
      )}

      {/* Gradient overlay — strong at bottom */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.55) 45%, transparent 100%)" }}
      />

      {/* Play on Spotify */}
      <a
        href={`https://open.spotify.com/track/${track.id}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
        style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <svg viewBox="0 0 24 24" fill="#22E05A" className="w-3 h-3 shrink-0">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <span className="text-white/60 text-[11px] font-semibold">Play</span>
      </a>

      {/* KEEP overlay */}
      {overlayX && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none flex items-start justify-end p-5"
          style={{ opacity: keepOpacity, background: "rgba(34,224,90,0.12)", border: "2px solid rgba(34,224,90,0.6)", boxShadow: "inset 0 0 40px rgba(34,224,90,0.08)" }}
        >
          <div className="rotate-[-12deg] mt-2 px-4 py-2 rounded-xl" style={{ border: "2.5px solid #22E05A" }}>
            <span className="font-black text-3xl tracking-widest" style={{ color: "#22E05A", textShadow: "0 0 20px #22E05A" }}>
              KEEP
            </span>
          </div>
        </motion.div>
      )}

      {/* REMOVE overlay */}
      {overlayX && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none flex items-start justify-start p-5"
          style={{ opacity: removeOpacity, background: "rgba(240,36,143,0.12)", border: "2px solid rgba(240,36,143,0.6)", boxShadow: "inset 0 0 40px rgba(240,36,143,0.08)" }}
        >
          <div className="rotate-[12deg] mt-2 px-4 py-2 rounded-xl" style={{ border: "2.5px solid #F0248F" }}>
            <span className="font-black text-3xl tracking-widest" style={{ color: "#F0248F", textShadow: "0 0 20px #F0248F" }}>
              NOPE
            </span>
          </div>
        </motion.div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
        {hasPreview && (
          <div className="mb-4">
            <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%`, background: "linear-gradient(90deg, #22E05A, #17b549)" }}
              />
            </div>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-[22px] leading-tight line-clamp-2" style={{ letterSpacing: "-0.02em" }}>
              {track.name}
            </h2>
            <p className="text-[15px] font-semibold truncate mt-1" style={{ color: "#8A8A8A" }}>
              {artist}
            </p>
            <p className="text-[13px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              {track.album.name}
            </p>
          </div>
          <div className="flex-shrink-0">
            {hasPreview && <AudioVisualizer playing={playing} />}
          </div>
        </div>
      </div>
    </div>
  );
}
