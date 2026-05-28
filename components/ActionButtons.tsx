"use client";
import { motion } from "framer-motion";

interface ActionButtonsProps {
  onKeep: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export default function ActionButtons({ onKeep, onRemove, disabled }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-10">
      <motion.button
        whileTap={{ scale: 0.78 }}
        whileHover={{ scale: 1.1 }}
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove"
        className="relative w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: "rgba(240,36,143,0.08)",
          border: "1.5px solid rgba(240,36,143,0.35)",
          boxShadow: "0 0 18px rgba(240,36,143,0.15)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#F0248F" strokeWidth="2.5" strokeLinecap="round" className="w-7 h-7">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.78 }}
        whileHover={{ scale: 1.1 }}
        onClick={onKeep}
        disabled={disabled}
        aria-label="Keep"
        className="relative w-20 h-20 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: "rgba(34,224,90,0.08)",
          border: "1.5px solid rgba(34,224,90,0.35)",
          boxShadow: "0 0 24px rgba(34,224,90,0.2)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="#22E05A" className="w-9 h-9">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </motion.button>

      <div className="w-16 h-16" />
    </div>
  );
}
