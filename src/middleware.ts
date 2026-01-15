import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security middleware for all requests
 * Applies security headers globally
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Next.js requires request parameter
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // Content Security Policy (basic - can be expanded)
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.resend.com",
      "frame-ancestors 'none'",
    ].join("; "),
  );

  // Prevent MIME type sniffing
  response.headers.set("X-Download-Options", "noopen");

  return response;
}

// Configure which routes the middleware should run on
export const matcher = [
  // Apply to all routes except API routes (they have their own headers)
  // and static files
  "/((?!api|_next/static|_next/image|favicon.ico).*)",
];
