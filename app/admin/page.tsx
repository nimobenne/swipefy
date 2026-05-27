"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface AdminNomination {
  id: string;
  spotify_url: string;
  pitch: string;
  submitted_name: string;
  submitted_at: string;
  status: string;
  vote_count: number;
}

export default function AdminPage() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const [nominations, setNominations] = useState<AdminNomination[]>([]);
  const [weekOf, setWeekOf] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

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

  const updateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/nominations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        console.error("[admin] update failed", await res.text());
        return;
      }
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
        <div className="w-8 h-8 rounded-full border-2 border-spotify-green border-t-transparent animate-spin" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white font-bold">Access denied</p>
        <button onClick={() => router.push("/discover")} className="text-subtext text-sm">
          Go back
        </button>
      </div>
    );
  }

  const pending = nominations.filter((n) => n.status === "pending");
  const decided = nominations.filter((n) => n.status !== "pending");

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
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
        <p className="text-subtext text-sm mb-2">Week of {weekOf}</p>
        <p className="text-subtext text-xs mb-6">
          To add an approved playlist to this week&apos;s pool: approve it here, then go to{" "}
          <button onClick={() => router.push("/submit")} className="text-spotify-green hover:underline">
            /submit
          </button>{" "}
          and paste the URL.
        </p>

        {pending.length === 0 && decided.length === 0 && (
          <p className="text-subtext text-sm text-center py-12">No nominations this week yet.</p>
        )}

        {pending.length > 0 && (
          <>
            <h2 className="text-white font-bold mb-3">Pending ({pending.length})</h2>
            <div className="flex flex-col gap-3 mb-8">
              {pending.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{n.pitch}</p>
                      <p className="text-subtext text-xs mt-0.5">by {n.submitted_name} · {n.vote_count} votes</p>
                      <a
                        href={n.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-spotify-green text-xs hover:underline mt-0.5 block truncate"
                      >
                        {n.spotify_url}
                      </a>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateStatus(n.id, "approved")}
                        disabled={updating === n.id}
                        className="px-3 py-1.5 rounded-xl bg-spotify-green text-black text-xs font-black hover:bg-green-400 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(n.id, "rejected")}
                        disabled={updating === n.id}
                        className="px-3 py-1.5 rounded-xl bg-white/10 text-subtext text-xs font-semibold hover:bg-white/15 transition-colors disabled:opacity-50"
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
                  className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/10 opacity-60"
                >
                  <p className="text-white text-sm truncate">{n.pitch}</p>
                  <span className={`text-xs font-bold flex-shrink-0 ${n.status === "approved" ? "text-spotify-green" : "text-subtext"}`}>
                    {n.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
}
