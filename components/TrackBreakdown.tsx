// components/TrackBreakdown.tsx
"use client";
import { motion } from "framer-motion";
import { SpotifyTrack } from "@/types";

interface TrackBreakdownProps {
  tracks: SpotifyTrack[];
  breakdown: Record<string, { yes: number; no: number; pct: number }>;
}

export default function TrackBreakdown({ tracks, breakdown }: TrackBreakdownProps) {
  return (
    <div className="flex flex-col gap-2">
      {tracks.map((track) => {
        const stat = breakdown[track.id];
        const pct = stat?.pct ?? 0;
        const total = (stat?.yes ?? 0) + (stat?.no ?? 0);
        return (
          <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <img
              src={track.album.images[track.album.images.length - 1]?.url}
              alt={track.name}
              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{track.name}</p>
              <p className="text-subtext text-[11px] truncate">{track.artists[0]?.name}</p>
              <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: pct >= 70 ? "#1DB954" : pct >= 40 ? "#FF9800" : "#E91E8C",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span
                className="text-sm font-black"
                style={{ color: pct >= 70 ? "#1DB954" : pct >= 40 ? "#FF9800" : "#E91E8C" }}
              >
                {total > 0 ? `${pct}%` : "—"}
              </span>
              {total > 0 && <p className="text-subtext text-[10px]">{total} votes</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
