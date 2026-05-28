import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) return NextResponse.redirect(new URL("/", req.url));

  const { searchParams } = new URL(req.url);
  const playlistUrl = searchParams.get("playlist_url") ?? "";

  const payload = JSON.stringify({ userId: session.userId, playlistUrl, ts: Date.now() });
  const sig = crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET!).update(payload).digest("hex");
  const state = Buffer.from(payload).toString("base64url") + "." + sig;

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", `${process.env.NEXTAUTH_URL}/api/spotify-callback`);
  authUrl.searchParams.set("scope", "playlist-read-private playlist-read-collaborative");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
