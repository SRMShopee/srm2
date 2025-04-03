import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Paths that don't require authentication
 */
const PUBLIC_PATHS = [
  "/sign-in",
  "/api/login",
  "/api/redirect-check",
  "/_next",
  "/favicon.ico",
  "/images",
];

/**
 * Static file extensions that should bypass authentication
 */
const STATIC_EXTENSIONS = [
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".css",
  ".js",
];

/**
 * Checks if a path is in the public paths list
 * @param path The URL path to check
 * @returns True if the path is public
 */
const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath));
};

/**
 * Checks if a path is a static asset
 * @param path The URL path to check
 * @returns True if the path is a static asset
 */
const isStaticAsset = (path: string): boolean => {
  return STATIC_EXTENSIONS.some((ext) => path.endsWith(ext));
};

/**
 * Middleware function to handle authentication and protected routes
 * @param request The incoming request
 */
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Skip middleware for non-dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Check for authentication using multiple indicators
  const hasSessionCookie = request.cookies.has("session");
  const hasAuthStatusCookie = request.cookies.has("auth_status");
  const hasClientSession = request.headers.get("x-has-session") === "true";
  const isAuthenticated =
    hasSessionCookie || hasAuthStatusCookie || hasClientSession;

  // If not authenticated and trying to access a protected route
  if (!isAuthenticated && !isPublicPath(pathname) && !isStaticAsset(pathname)) {
    // Redirect to login page
    const redirectUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Add session header to response
  const response = NextResponse.next();
  if (isAuthenticated) {
    response.headers.set("x-has-session", "true");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes (for login/logout)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
