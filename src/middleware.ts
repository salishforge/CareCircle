import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers middleware.
 * Runs on every request to add protective HTTP headers.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer policy — send origin only for cross-origin requests
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // DNS prefetch control
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // Permissions policy — restrict sensitive browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=()"
  );

  // HTTPS enforcement (when deployed)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Content Security Policy — allow self, inline styles (Tailwind), and configured domains
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.anthropic.com https://*.resend.com",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.json|offline.html).*)",
  ],
};
