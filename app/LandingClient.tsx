"use client";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function LandingClient() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #1DB954, transparent)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #E91E8C, transparent)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: "radial-gradient(circle, #1DB954, #E91E8C)" }}
        />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <div className="relative">
            <div
              className="w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #1DB954 0%, #17a349 50%, #E91E8C 100%)",
              }}
            >
              {/* Combined Spotify + Tinder icon */}
              <svg viewBox="0 0 40 40" fill="none" className="w-11 h-11">
                {/* Music note */}
                <path
                  d="M16 10v14.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V14h8v-4h-10z"
                  fill="white"
                  opacity="0.9"
                />
                {/* Heart */}
                <path
                  d="M28 11.5c-1.1-1.1-2.9-1.1-4 0l-.5.5-.5-.5c-1.1-1.1-2.9-1.1-4 0-1.1 1.1-1.1 2.9 0 4l4.5 4.5 4.5-4.5c1.1-1.1 1.1-2.9 0-4z"
                  fill="white"
                />
              </svg>
            </div>
            {/* Glow */}
            <div
              className="absolute inset-0 rounded-[28px] blur-xl opacity-40 -z-10"
              style={{ background: "linear-gradient(135deg, #1DB954, #E91E8C)" }}
            />
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight">
              Swipe
              <span style={{ color: "#1DB954" }}>fy</span>
            </h1>
            <p className="text-subtext text-sm mt-1 font-medium">
              Curate your Spotify, one swipe at a time
            </p>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { icon: "🎵", text: "30s previews" },
            { icon: "👈", text: "Swipe to remove" },
            { icon: "💚", text: "Keep the bangers" },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-subtext"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="w-full flex flex-col gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
            className="w-full py-4 rounded-2xl font-black text-lg text-black flex items-center justify-center gap-3 shadow-lg"
            style={{ background: "linear-gradient(135deg, #1DB954, #17a349)" }}
          >
            {/* Spotify logo */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Continue with Spotify
          </motion.button>

          <p className="text-center text-white/25 text-xs">
            We only read and modify your playlists. Nothing else.
          </p>
        </motion.div>

        {/* Bottom decoration */}
        <motion.div
          className="flex items-center gap-3 opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.6 }}
        >
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-xs text-white/50">Swipefy · 2025</span>
          <div className="h-px flex-1 bg-white/20" />
        </motion.div>
      </motion.div>
    </main>
  );
}
