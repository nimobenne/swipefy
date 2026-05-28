import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

let _supabase: SupabaseClient | null = null;
let _supabasePublic: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars not set");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export function getSupabasePublic(): SupabaseClient {
  if (!_supabasePublic) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase public env vars not set");
    _supabasePublic = createClient(url, key);
  }
  return _supabasePublic;
}

/** @deprecated Use getSupabase() instead */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** @deprecated Use getSupabasePublic() instead */
export const supabasePublic = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabasePublic() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function makeVoterFingerprint(userId: string): string {
  return crypto
    .createHash("sha256")
    .update(userId + process.env.NEXTAUTH_SECRET)
    .digest("hex");
}

export interface PublicPlaylist {
  id: string;
  spotify_playlist_id: string;
  owner_id: string;
  owner_display_name: string;
  name: string;
  cover_url: string | null;
  track_count: number;
  is_active: boolean;
  submitted_at: string;
}

export interface PlaylistScore {
  playlist_id: string;
  total_votes: number;
  approval_pct: number;
  unique_voters: number;
}
