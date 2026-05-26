// app/dashboard/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import TrackBreakdown from "@/components/TrackBreakdown";
import { SpotifyTrack } from "@/types";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
        <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-4xl">🎵</p>
        <p className="text-white font-bold text-lg">No playlist submitted yet</p>
        <p className="text-subtext text-sm">Submit one to get your approval score.</p>
        <button
          onClick={() => router.push("/submit")}
          className="mt-4 px-6 py-3 rounded-2xl bg-spotify-green text-black font-black text-sm"
        >
          Submit a playlist
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => router.push("/discover")}
          className="text-subtext hover:text-white transition-colors mb-4 flex items-center gap-1 text-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to discover
        </button>

        <div className="flex items-center gap-4 mb-6">
          {playlist.cover_url && (
            <img src={playlist.cover_url} alt={playlist.name} className="w-16 h-16 rounded-xl object-cover" />
          )}
          <div>
            <h1 className="text-white text-xl font-black">{playlist.name}</h1>
            <p className="text-subtext text-sm">{playlist.track_count} tracks</p>
          </div>
        </div>

        {score && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div
                className="text-3xl font-black mb-1"
                style={{ color: score.approval_pct >= 70 ? "#1DB954" : score.approval_pct >= 40 ? "#FF9800" : "#E91E8C" }}
              >
                {score.approval_pct}%
              </div>
              <div className="text-subtext text-xs uppercase tracking-wider">Approval</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-white mb-1">{score.total_votes}</div>
              <div className="text-subtext text-xs uppercase tracking-wider">Votes</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-white mb-1">{score.unique_voters}</div>
              <div className="text-subtext text-xs uppercase tracking-wider">Listeners</div>
            </div>
          </div>
        )}

        {!score && (
          <div className="bg-white/5 rounded-2xl p-6 text-center mb-8">
            <p className="text-subtext text-sm">No votes yet. Share your playlist to get the ball rolling.</p>
          </div>
        )}
      </motion.div>

      {tracks.length > 0 && Object.keys(breakdown).length > 0 && (
        <>
          <h2 className="text-white font-bold mb-3">Track breakdown</h2>
          <TrackBreakdown tracks={tracks} breakdown={breakdown} />
        </>
      )}

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.push("/submit")}
          className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-colors"
        >
          Swap playlist
        </button>
        <button
          onClick={() => router.push("/discover")}
          className="flex-1 py-3 rounded-2xl bg-spotify-green text-black font-black text-sm hover:bg-green-400 transition-colors"
        >
          Rate others
        </button>
      </div>
    </main>
  );
}
