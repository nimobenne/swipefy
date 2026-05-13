"use client";
import { motion } from "framer-motion";

interface ActionButtonsProps {
  onKeep: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export default function ActionButtons({ onKeep, onRemove, disabled }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-8">
      {/* Remove button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.08 }}
        onClick={onRemove}
        disabled={disabled}
        className="group relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-shadow hover:shadow-remove/30 hover:shadow-xl"
        style={{
          background: "rgba(233,30,140,0.1)",
          border: "2px solid rgba(233,30,140,0.3)",
        }}
        aria-label="Remove from playlist"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E91E8C"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="w-7 h-7 group-hover:stroke-[3]"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </motion.button>

      {/* Keep button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.08 }}
        onClick={onKeep}
        disabled={disabled}
        className="group relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-shadow hover:shadow-spotify-green/30 hover:shadow-xl"
        style={{
          background: "rgba(29,185,84,0.1)",
          border: "2px solid rgba(29,185,84,0.3)",
        }}
        aria-label="Keep in playlist"
      >
        <svg
          viewBox="0 0 24 24"
          fill="#1DB954"
          className="w-9 h-9 group-hover:scale-110 transition-transform"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </motion.button>

      {/* Skip / info placeholder — keeps symmetry */}
      <div className="w-16 h-16" />
    </div>
  );
}
