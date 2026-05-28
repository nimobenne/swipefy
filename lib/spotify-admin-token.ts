import { getSupabase } from "@/lib/supabase";

async function refreshSpotifyToken(refreshToken: string): Promise<{ access_token: string; expires_at: number }> {
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`Spotify refresh failed: ${res.status}`);
  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
}

export async function getAdminAccessToken(userId: string): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("admin_spotify_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new Error("no_spotify_token");

  if (Date.now() < (data.expires_at as number)) return data.access_token as string;

  const refreshed = await refreshSpotifyToken(data.refresh_token as string);
  await sb
    .from("admin_spotify_tokens")
    .update({
      access_token: refreshed.access_token,
      expires_at: refreshed.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}

export async function storeAdminToken(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  await getSupabase()
    .from("admin_spotify_tokens")
    .upsert(
      {
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Date.now() + (expiresIn - 60) * 1000,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
}

export async function deleteAdminToken(userId: string): Promise<void> {
  await getSupabase().from("admin_spotify_tokens").delete().eq("user_id", userId);
}

export async function hasAdminToken(userId: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from("admin_spotify_tokens")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  return !!data;
}
