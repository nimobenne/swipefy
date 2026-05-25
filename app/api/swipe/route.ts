import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: true });
}

export async function PUT() {
  return NextResponse.json({ sessionId: null });
}
