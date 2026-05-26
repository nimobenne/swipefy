import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
