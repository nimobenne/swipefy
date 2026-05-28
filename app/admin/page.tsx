"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface AdminNomination {
  id: string;
  spotify_url: string;
  pitch: string;
  submitted_name: string;
  submitted_at: string;
  status: string;
  vote_count: number;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  coverUrl: string | null;
  trackCount: number;
  owner: string;
}

interface PoolPlaylist {
  id: string;
  name: string;
  cover_url: string | null;
  track_count: number;
  week_of: string;
  spotify_playlist_id: string;
}

type SpotifyStatus = "loading" | "disconnected" | "connected";

export default function AdminPage() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nominations, setNominations] = useState<AdminNomination[]>([]);
  const [weekOf, setWeekOf] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus>("loading");
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [poolPlaylists, setPoolPlaylists] = useState<PoolPlaylist[]>([]);
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [inPool, setInPool] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Handle OAuth callback query params
  useEffect(() => {
    const spotifyParam = searchParams.get("spotify");
    const spotifyError = searchParams.get("spotify_error");
    if (spotifyParam === "connected") {
      showToast("Spotify connected!");
      router.replace("/admin");
    } else if (spotifyError) {
      showToast(`Spotify error: ${spotifyError}`);
      router.replace("/admin");
    }
  }, [searchParams, router, showToast]);

  // Load nominations
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/nominations")
      .then(async (res) => {
        if (res.status === 403) { setForbidden(true); return; }
        const data = await res.json();
        setNominations(data.nominations ?? []);
        setWeekOf(data.weekOf ?? "");
      })
      .finally(() => setLoading(false));
  }, [status]);

  // Load Spotify connection status + pool
  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/admin/spotify/playlists").then((r) => r.json()),
      fetch("/api/admin/pool").then((r) => r.json()),
    ]).then(([spotifyData, poolData]) => {
      const pool: PoolPlaylist[] = poolData.playlists ?? [];
      setPoolPlaylists(pool);
      setInPool(new Set(pool.map((p) => p.spotify_playlist_id)));

      if (spotifyData.connected) {
        setSpotifyStatus("connected");
        setSpotifyPlaylists(spotifyData.playlists ?? []);
      } else {
        setSpotifyStatus("disconnected");
      }
    }).catch(() => setSpotifyStatus("disconnected"));
  }, [status]);

  const handleAddToPool = async (playlist: SpotifyPlaylist) => {
    setAdding((prev) => new Set(prev).add(playlist.id));
    try {
      const res = await fetch("/api/admin/spotify/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyPlaylistId: playlist.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to add playlist");
        return;
      }
      setInPool((prev) => new Set(prev).add(playlist.id));
      const poolRes = await fetch("/api/admin/pool");
      const poolData = await poolRes.json();
      setPoolPlaylists(poolData.playlists ?? []);
      showToast(`Added "${data.name}" · ${data.trackCount} tracks`);
    } finally {
      setAdding((prev) => { const s = new Set(prev); s.delete(playlist.id); return s; });
    }
  };

  const handleRemoveFromPool = async (pool: PoolPlaylist) => {
    setRemoving((prev) => new Set(prev).add(pool.id));
    try {
      const res = await fetch(`/api/admin/pool/${pool.id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Failed to remove"); return; }
      setPoolPlaylists((prev) => prev.filter((p) => p.id !== pool.id));
      setInPool((prev) => { const s = new Set(prev); s.delete(pool.spotify_playlist_id); return s; });
      showToast(`Removed "${pool.name}"`);
    } finally {
      setRemoving((prev) => { const s = new Set(prev); s.delete(pool.id); return s; });
    }
  };

  const handleDisconnect = async () => {
    await fetch("/api/admin/spotify/disconnect", { method: "DELETE" });
    setSpotifyStatus("disconnected");
    setSpotifyPlaylists([]);
    showToast("Spotify disconnected");
  };

  const updateNominationStatus = async (id: string, newStatus: "approved" | "rejected") => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/nominations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      setNominations((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
      );
    } finally {
      setUpdating(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#22E05A33", borderTopColor: "#22E05A" }} />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white font-bold">Access denied</p>
        <button onClick={() => router.push("/discover")} className="text-subtext text-sm">Go back</button>
      </div>
    );
  }

  const pending = nominations.filter((n) => n.status === "pending");
  const decided = nominations.filter((n) => n.status !== "pending");

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
            style={{
              background: "rgba(20,20,28,0.95)",
              border: "1px solid rgba(34,224,90,0.3)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/discover")}
            className="text-subtext hover:text-white transition-colors flex items-center gap-1 text-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <span className="text-subtext text-xs">admin</span>
        </div>

        <h1 className="text-white text-2xl font-black mb-1">Admin panel</h1>
        <p className="text-subtext text-sm mb-8">Week of {weekOf}</p>

        {/* ── PLAYLIST POOL ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Playlist pool</h2>
            {spotifyStatus === "connected" && (
              <button
                onClick={handleDisconnect}
                className="text-xs transition-colors"
                style={{ color: "#444" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#aaa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
              >
                Disconnect Spotify
              </button>
            )}
          </div>

          {/* Active pool list */}
          {poolPlaylists.length > 0 && (
            <div className="flex flex-col gap-2 mb-6">
              {poolPlaylists.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {p.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                      style={{ background: "rgba(255,255,255,0.07)" }}>
                      🎵
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs" style={{ color: "#555" }}>{p.track_count} tracks</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromPool(p)}
                    disabled={removing.has(p.id)}
                    className="text-xs flex-shrink-0 transition-colors disabled:opacity-40"
                    style={{ color: "#444" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#F0248F")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
                  >
                    {removing.has(p.id) ? "…" : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {poolPlaylists.length === 0 && spotifyStatus !== "loading" && (
            <p className="text-sm mb-5" style={{ color: "#444" }}>No playlists in the pool yet.</p>
          )}

          {/* Spotify loading */}
          {spotifyStatus === "loading" && (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#22E05A33", borderTopColor: "#22E05A" }} />
            </div>
          )}

          {/* Not connected */}
          {spotifyStatus === "disconnected" && (
            <a
              href="/api/admin/spotify/auth"
              className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{
                background: "rgba(34,224,90,0.08)",
                border: "1px solid rgba(34,224,90,0.2)",
                color: "#22E05A",
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Connect Spotify to browse playlists
            </a>
          )}

          {/* Connected — playlist browser */}
          {spotifyStatus === "connected" && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ background: "#22E05A" }} />
                <span className="text-xs" style={{ color: "#555" }}>
                  Spotify connected · your library
                </span>
              </div>

              {spotifyPlaylists.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "#444" }}>No playlists found.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {spotifyPlaylists.map((p) => {
                    const isInPool = inPool.has(p.id);
                    const isAdding = adding.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {p.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.coverUrl} alt={p.name} className="w-full aspect-square object-cover" />
                        ) : (
                          <div
                            className="w-full aspect-square flex items-center justify-center text-3xl"
                            style={{ background: "linear-gradient(135deg, rgba(34,224,90,0.1), rgba(240,36,143,0.1))" }}
                          >
                            🎵
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-white text-xs font-semibold truncate mb-0.5">{p.name}</p>
                          <p className="text-[11px] mb-2.5" style={{ color: "#555" }}>{p.trackCount} tracks</p>
                          <button
                            onClick={() => !isInPool && !isAdding && handleAddToPool(p)}
                            disabled={isInPool || isAdding}
                            className="w-full py-1.5 rounded-xl text-xs font-black transition-all disabled:cursor-default"
                            style={
                              isInPool
                                ? { background: "rgba(34,224,90,0.1)", color: "#22E05A", border: "1px solid rgba(34,224,90,0.2)" }
                                : isAdding
                                ? { background: "rgba(255,255,255,0.06)", color: "#666" }
                                : { background: "linear-gradient(135deg, #22E05A, #17b549)", color: "#080808" }
                            }
                          >
                            {isAdding ? "Adding…" : isInPool ? "In Pool ✓" : "Add to Pool"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── NOMINATIONS ── */}
        <div className="w-full h-px mb-8" style={{ background: "rgba(255,255,255,0.06)" }} />

        {pending.length === 0 && decided.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "#444" }}>No nominations this week yet.</p>
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <h2 className="text-white font-bold mb-3">Pending ({pending.length})</h2>
                <div className="flex flex-col gap-3 mb-8">
                  {pending.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{n.pitch}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#555" }}>
                            by {n.submitted_name} · {n.vote_count} votes
                          </p>
                          <a
                            href={n.spotify_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs hover:underline mt-0.5 block truncate"
                            style={{ color: "#22E05A" }}
                          >
                            {n.spotify_url}
                          </a>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => updateNominationStatus(n.id, "approved")}
                            disabled={updating === n.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-black transition-colors disabled:opacity-50"
                            style={{ background: "#22E05A", color: "#080808" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateNominationStatus(n.id, "rejected")}
                            disabled={updating === n.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                            style={{ background: "rgba(255,255,255,0.1)", color: "#888" }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {decided.length > 0 && (
              <>
                <h2 className="text-white font-bold mb-3">Decided ({decided.length})</h2>
                <div className="flex flex-col gap-2">
                  {decided.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl opacity-50"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="text-white text-sm truncate">{n.pitch}</p>
                      <span
                        className="text-xs font-bold flex-shrink-0"
                        style={{ color: n.status === "approved" ? "#22E05A" : "#555" }}
                      >
                        {n.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </motion.div>
    </main>
  );
}
