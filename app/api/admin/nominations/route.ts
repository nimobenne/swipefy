import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { currentWeekStart } from "@/lib/weekly";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log("[admin] userId:", JSON.stringify(session?.userId), "adminId:", JSON.stringify(process.env.ADMIN_USER_ID), "match:", session?.userId?.trim() === process.env.ADMIN_USER_ID?.trim());
  if (!session?.userId || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const weekOf = currentWeekStart();

  const { data: nominations, error } = await supabase
    .from("nominations")
    .select("id, spotify_url, pitch, submitted_by, submitted_name, submitted_at, status, week_of")
    .eq("week_of", weekOf)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[admin/nominations] fetch failed", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (nominations ?? []).map((n) => n.id);
  const { data: voteCounts } = await supabase
    .from("nomination_votes")
    .select("nomination_id")
    .in("nomination_id", ids.length ? ids : ["none"]);

  const voteMap: Record<string, number> = {};
  for (const v of voteCounts ?? []) {
    voteMap[v.nomination_id] = (voteMap[v.nomination_id] ?? 0) + 1;
  }

  const result = (nominations ?? [])
    .map((n) => ({ ...n, vote_count: voteMap[n.id] ?? 0 }))
    .sort((a, b) => b.vote_count - a.vote_count);

  return NextResponse.json({ nominations: result, weekOf });
}
