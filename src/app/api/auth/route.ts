import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "@/utils/session";

// Get the current session
export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
  });
}

// Sign out
export async function DELETE() {
  cookies().delete("session");
  return NextResponse.json({ success: true });
}
