import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/admin";
import { storeAdminToken } from "@/lib/spotify-admin-token";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL!;
  const session = await getServerSession(authOptions);
  if (!session?.userId || !isAdmin(session.userId)) {
    return NextResponse.redirect(`${base}/`);
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${base}/admin?spotify_error=denied`);
  }

  try {
    const dot = stateRaw.lastIndexOf(".");
    const state = stateRaw.slice(0, dot);
    const sig = stateRaw.slice(dot + 1);
    const expected = crypto
      .createHmac("sha256", process.env.NEXTAUTH_SECRET!)
      .update(state)
      .digest("hex");
    if (sig !== expected) throw new Error("bad sig");
  } catch {
    return NextResponse.redirect(`${base}/admin?spotify_error=invalid_state`);
  }

  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${base}/api/admin/spotify/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token || !tokenData.refresh_token) {
    return NextResponse.redirect(`${base}/admin?spotify_error=token_failed`);
  }

  await storeAdminToken(
    session.userId,
    tokenData.access_token,
    tokenData.refresh_token,
    tokenData.expires_in
  );

  return NextResponse.redirect(`${base}/admin?spotify=connected`);
}
