import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !isAdmin(session.userId)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const state = crypto.randomBytes(16).toString("hex");
  const sig = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET!)
    .update(state)
    .digest("hex");
  const signedState = `${state}.${sig}`;

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set(
    "redirect_uri",
    `${process.env.NEXTAUTH_URL}/api/admin/spotify/callback`
  );
  authUrl.searchParams.set("scope", "playlist-read-private playlist-read-collaborative");
  authUrl.searchParams.set("state", signedState);

  return NextResponse.redirect(authUrl.toString());
}
