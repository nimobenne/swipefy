import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getPlaylistTracksWithToken, getPlaylistMetadataWithToken } from "@/lib/spotify";
import { currentWeekStart } from "@/lib/weekly";
import crypto from "crypto";

function extractPlaylistId(input: string): string | null {
  // https://open.spotify.com/playlist/ID or /playlist/ID?si=...
  const urlMatch = input.match(/playlist[/:]([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  // Raw ID
  if (/^[A-Za-z0-9]{10,40}$/.test(input.trim())) return input.trim();
  return null;
}

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL!;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${base}/submit?error=spotify_denied`);
  }

  let userId: string, playlistUrl: string;
  try {
    const dot = stateRaw.lastIndexOf(".");
    const payloadB64 = stateRaw.slice(0, dot);
    const sig = stateRaw.slice(dot + 1);
    const payload = Buffer.from(payloadB64, "base64").toString();
    const expected = crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET!).update(payload).digest("hex");
    if (sig !== expected) throw new Error("bad sig");
    ({ userId, playlistUrl } = JSON.parse(payload));
  } catch {
    return NextResponse.redirect(`${base}/submit?error=invalid_state`);
  }

  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) return NextResponse.redirect(`${base}/submit?error=invalid_url`);

  // Exchange code for Spotify access token
  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${base}/api/spotify-callback`,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("[spotify-callback] token exchange failed", tokenData);
    return NextResponse.redirect(`${base}/submit?error=token_failed`);
  }

  const token = tokenData.access_token;

  let metadata, tracks;
  try {
    metadata = await getPlaylistMetadataWithToken(playlistId, token);
    console.log("[spotify-callback] metadata ok:", metadata.name);
  } catch (e) {
    console.error("[spotify-callback] metadata failed:", e instanceof Error ? e.message : String(e));
    return NextResponse.redirect(`${base}/submit?error=metadata_failed`);
  }
  try {
    tracks = await getPlaylistTracksWithToken(playlistId, token);
    console.log("[spotify-callback] tracks ok:", tracks.length);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[spotify-callback] tracks failed:", msg);
    return NextResponse.redirect(`${base}/submit?error=${encodeURIComponent(msg)}`);
  }

  await supabase.from("public_playlists").update({ is_active: false }).eq("owner_id", userId).eq("is_active", true);

  const { error } = await supabase.from("public_playlists").upsert(
    {
      spotify_playlist_id: playlistId,
      owner_id: userId,
      owner_display_name: metadata.ownerDisplayName,
      name: metadata.name,
      cover_url: metadata.coverUrl,
      track_count: tracks.length || metadata.trackCount,
      tracks_json: tracks,
      is_active: true,
      week_of: currentWeekStart(),
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "spotify_playlist_id" }
  );

  if (error) {
    console.error("[spotify-callback] supabase upsert failed", error.message);
    return NextResponse.redirect(`${base}/submit?error=save_failed`);
  }

  return NextResponse.redirect(`${base}/dashboard`);
}
