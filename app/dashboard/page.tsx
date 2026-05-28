// app/dashboard/page.tsx
"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import TrackBreakdown from "@/components/TrackBreakdown";
import UserMenu from "@/components/UserMenu";
import { SpotifyTrack } from "@/types";

interface SubmittedPlaylist {
  id: string;
  spotify_playlist_id: string;
  name: string;
  cover_url: string | null;
  track_count: number;
}

interface Score {
  approval_pct: number;
  total_votes: number;
  unique_voters: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const supabaseClient = useMemo(
    () => createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
    ),
    []
  );
  const [playlist, setPlaylist] = useState<SubmittedPlaylist | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [breakdown, setBreakdown] = useState<Record<string, { yes: number; no: number; pct: number }>>({});
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScore = useCallback(async (playlistId: string) => {
    const res = await fetch(`/api/scores/${playlistId}`);
    if (!res.ok) return;
    const data = await res.json();
    setScore(data.score);
    setBreakdown(data.trackBreakdown ?? {});
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.userId) return;

    // Fetch user's submitted playlist
    supabaseClient
      .from("public_playlists")
      .select("id, spotify_playlist_id, name, cover_url, track_count")
      .eq("owner_id", session.userId)
      .eq("is_active", true)
      .single()
      .then(
        ({ data }) => {
          if (!data) { setLoading(false); return; }
          setPlaylist(data as SubmittedPlaylist);
          fetchScore(data.id);
          // Load tracks from Spotify
          fetch(`/api/playlist/${data.spotify_playlist_id}`)
            .then((r) => r.json())
            .then((d) => setTracks(d.tracks ?? []))
            .finally(() => setLoading(false));
        },
        () => setLoading(false)
      );
  }, [status, session?.userId, fetchScore]);

  // Realtime subscription — refresh score on every new vote
  useEffect(() => {
    if (!playlist) return;
    const channel = supabaseClient
      .channel(`votes:${playlist.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "track_votes", filter: `playlist_id=eq.${playlist.id}` },
        () => fetchScore(playlist.id)
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [playlist?.id, fetchScore]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#22E05A33", borderTopColor: "#22E05A" }}
        />
      </div>
    );
  }

  if (!playlist) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p className="text-5xl">🎵</p>
        <p className="text-white font-black text-xl" style={{ letterSpacing: "-0.02em" }}>Nothing submitted yet</p>
        <p className="text-sm" style={{ color: "#555" }}>Submit a playlist to see your approval score.</p>
        <button
          onClick={() => router.push("/submit")}
          className="mt-2 px-6 py-3.5 rounded-2xl font-black text-sm"
          style={{ background: "linear-gradient(135deg, #22E05A, #17b549)", color: "#080808", boxShadow: "0 4px 20px rgba(34,224,90,0.25)" }}
        >
          Submit a playlist
        </button>
      </motion.div>
    );
  }

  const approvalColor = score
    ? score.approval_pct >= 70 ? "#22E05A" : score.approval_pct >= 40 ? "#FF9800" : "#F0248F"
    : "#22E05A";

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/discover")}
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: "#555" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <UserMenu />
        </div>

        <div className="flex items-center gap-4 mb-7">
          {playlist.cover_url && (
            <img
              src={playlist.cover_url}
              alt={playlist.name}
              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
              style={{ boxShadow: "0 0 20px rgba(34,224,90,0.15)" }}
            />
          )}
          <div className="min-w-0">
            <h1 className="text-white font-black truncate" style={{ fontSize: "22px", letterSpacing: "-0.02em" }}>
              {playlist.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#555" }}>{playlist.track_count} tracks</p>
          </div>
        </div>

        {score ? (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { value: `${score.approval_pct}%`, label: "Approval", color: approvalColor },
              { value: score.total_votes, label: "Votes", color: "white" },
              { value: score.unique_voters, label: "Listeners", color: "white" },
            ].map(({ value, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="text-3xl font-black mb-1" style={{ color, letterSpacing: "-0.03em" }}>
                  {value}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#444" }}>
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 text-center mb-8"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm" style={{ color: "#555" }}>No votes yet. Share to get the ball rolling.</p>
          </div>
        )}
      </motion.div>

      {tracks.length > 0 && Object.keys(breakdown).length > 0 && (
        <>
          <h2 className="text-white font-bold mb-3" style={{ letterSpacing: "-0.01em" }}>Track breakdown</h2>
          <TrackBreakdown tracks={tracks} breakdown={breakdown} />
        </>
      )}

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.push("/submit")}
          className="flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Swap playlist
        </button>
        <button
          onClick={() => router.push("/discover")}
          className="flex-1 py-3.5 rounded-2xl font-black text-sm"
          style={{ background: "linear-gradient(135deg, #22E05A, #17b549)", color: "#080808" }}
        >
          Rate others
        </button>
      </div>
    </main>
  );
}
