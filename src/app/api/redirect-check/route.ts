import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// This endpoint helps diagnose redirection issues
export async function GET(request: NextRequest) {
  try {
    // Check for session cookie
    const sessionCookie = cookies().get("session");
    const authStatusCookie = cookies().get("auth_status");

    // Return information about the current session state
    return NextResponse.json({
      hasSessionCookie: !!sessionCookie,
      hasAuthStatusCookie: !!authStatusCookie,
      sessionCookieValue: sessionCookie ? "[REDACTED]" : null,
      authStatusValue: authStatusCookie ? authStatusCookie.value : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Redirect check API error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao verificar o estado da sessão." },
      { status: 500 },
    );
  }
}
