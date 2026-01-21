import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LANG_STORAGE_KEY } from "@/lib/i18n";

// Edge Runtime for Cloudflare Pages compatibility
// Note: Middleware doesn't need runtime export - it runs on edge by default

/**
 * Global security middleware for Cloudflare Pages (Edge Runtime).
 * Applies security headers for all non-API routes.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;
  const lang = pathname === "/zh" || pathname.startsWith("/zh/") ? "zh" : "en";
  const isDev = process.env.NODE_ENV !== "production";
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";
  let plausibleOrigin = "https://plausible.io";
  try {
    plausibleOrigin = new URL(plausibleSrc).origin;
  } catch {
    plausibleOrigin = "https://plausible.io";
  }

  response.cookies.set(LANG_STORAGE_KEY, lang, {
    path: "/",
    sameSite: "lax",
  });

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
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    plausibleOrigin,
    "https://challenges.cloudflare.com",
  ];
  if (isDev) scriptSrc.push("'unsafe-eval'");
  scriptSrc.push("https://www.googletagmanager.com");

  const connectSrc = [
    "'self'",
    "https://*.supabase.co",
    "https://api.openai.com",
    "https://api.resend.com",
    "https://www.google-analytics.com",
    plausibleOrigin,
    "https://challenges.cloudflare.com",
  ];
  if (plausibleDomain) {
    connectSrc.push(`https://${plausibleDomain}`);
  }

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src https://challenges.cloudflare.com",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  const reportOnly = process.env.CSP_REPORT_ONLY === "true";
  const reportUri =
    process.env.CSP_REPORT_URI || "/api/security/csp-report";
  if (reportOnly) {
    response.headers.set(
      "Content-Security-Policy-Report-Only",
      `${csp}; report-uri ${reportUri}`,
    );
  }

  // Prevent MIME type sniffing
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("Content-Language", lang === "zh" ? "zh-CN" : "en");

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  // Apply to all routes except API routes (they have their own headers)
  // and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
