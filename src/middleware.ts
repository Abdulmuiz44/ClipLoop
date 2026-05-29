import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js handle API routes, internal assets, static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/generated/") ||
    pathname === "/favicon.ico" ||
    pathname === "/index.html"
  ) {
    return NextResponse.next();
  }

  // Serve the Vite SPA for all other routes
  return NextResponse.rewrite(new URL("/index.html", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (Next.js static files)
     * - _next/image (Next.js image optimization)
     * - favicon.ico (browser favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
