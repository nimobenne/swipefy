import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/admin";
import { deleteAdminToken } from "@/lib/spotify-admin-token";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await deleteAdminToken(session.userId);
  return NextResponse.json({ success: true });
}
