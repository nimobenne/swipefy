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
              Rate playlists. Prove your taste.
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
            { icon: "🔥", text: "Vote yes or no" },
            { icon: "📊", text: "See your score" },
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
            onClick={() => signIn("google", { callbackUrl: "/discover" })}
            className="w-full py-4 rounded-2xl font-black text-lg text-black flex items-center justify-center gap-3 shadow-lg"
            style={{ background: "linear-gradient(135deg, #1DB954, #17a349)" }}
          >
            {/* Google logo */}
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          <p className="text-center text-white/25 text-xs">
            Sign in with Google. No Spotify account needed to vote.
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
          <span className="text-xs text-white/50">Swipefy · 2026</span>
          <div className="h-px flex-1 bg-white/20" />
        </motion.div>
      </motion.div>
    </main>
  );
}
