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

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(nominationId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
    const { error: deleteError } = await supabase
      .from("nomination_votes")
      .delete()
      .eq("nomination_id", nominationId)
      .eq("user_id", session.userId);
    if (deleteError) {
      console.error("[vote] delete failed", deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, voted: false });
  } else {
    const { error: insertError } = await supabase.from("nomination_votes").insert({
      nomination_id: nominationId,
      user_id: session.userId,
    });
    if (insertError) {
      console.error("[vote] insert failed", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, voted: true });
  }
}
