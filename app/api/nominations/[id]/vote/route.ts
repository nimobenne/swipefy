import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: nominationId } = await params;

  const { data: nomination } = await supabase
    .from("nominations")
    .select("id, status")
    .eq("id", nominationId)
    .single();

  if (!nomination) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (nomination.status !== "pending") {
    return NextResponse.json({ error: "Nomination is closed" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("nomination_votes")
    .select("nomination_id")
    .eq("nomination_id", nominationId)
    .eq("user_id", session.userId)
    .single();

  if (existing) {
    await supabase
      .from("nomination_votes")
      .delete()
      .eq("nomination_id", nominationId)
      .eq("user_id", session.userId);
    return NextResponse.json({ ok: true, voted: false });
  } else {
    await supabase.from("nomination_votes").insert({
      nomination_id: nominationId,
      user_id: session.userId,
    });
    return NextResponse.json({ ok: true, voted: true });
  }
}
