import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware function to handle authentication and protected routes
 * Uses our custom session management instead of Supabase auth
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Get the pathname from the URL
  const { pathname } = req.nextUrl;

  // Check for authentication using session cookie value, not just presence
  const sessionCookie = req.cookies.get("session");
  const authStatusCookie = req.cookies.get("auth_status");
  const isAuthenticated = sessionCookie?.value || authStatusCookie?.value;

  // If accessing dashboard routes without authentication, redirect to login
  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    const redirectUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Add session header to response if authenticated
  if (isAuthenticated) {
    res.headers.set("x-has-session", "true");
  }

  return res;
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
