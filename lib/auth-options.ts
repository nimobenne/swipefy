import { AuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read",
  "user-library-modify",
].join(" ");

async function refreshAccessToken(token: {
  refreshToken?: string;
  [key: string]: unknown;
}) {
  try {
    console.log("[auth] refreshing token, prefix:", String(token.refreshToken ?? "").slice(0, 20));
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken ?? "",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    console.log("[auth] refreshed scope:", data.scope, "new access prefix:", String(data.access_token).slice(0, 20));
    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      refreshToken: data.refresh_token ?? token.refreshToken,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

const useSecureCookies = process.env.NODE_ENV === "production";

export const authOptions: AuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: SPOTIFY_SCOPES,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/spotify`,
          show_dialog: true,
        },
      },
    }),
  ],
  cookies: {
    pkceCodeVerifier: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    state: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        console.log("[auth] granted scope:", account.scope);
        console.log("[auth] access token prefix:", String(account.access_token).slice(0, 20));
        console.log("[auth] refresh token present:", !!account.refresh_token);
        console.log("[auth] expires_at:", account.expires_at, "expires_in:", account.expires_in);
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? (token.refreshToken as string),
          expiresAt: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + ((account.expires_in as number) ?? 3600) * 1000,
        };
      }
      if (Date.now() < ((token.expiresAt as number) ?? 0)) {
        return token;
      }
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.error ? undefined : (token.accessToken as string);
      session.userId = token.sub;  // Spotify user ID from JWT sub claim
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
