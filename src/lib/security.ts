/**
 * Security utilities for P2 production level
 */

import { getRedisClient } from "./redis";

// Constants for validation
export const LIMITS = {
  MAX_TEXT_LENGTH: 2000,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_EMAIL_LENGTH: 320, // RFC 5321
  MAX_NOTE_LENGTH: 500,
  MAX_CAPTION_LENGTH: 1000,
  MAX_HASHTAGS_LENGTH: 500,
  MAX_VARIANT_LENGTH: 50,
} as const;

// Fallback in-memory store for when Redis is unavailable
const fallbackRateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Distributed rate limiter using Redis with in-memory fallback
 * Prevents rate limit bypass in multi-instance deployments
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60 * 1000,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowSec = Math.ceil(windowMs / 1000);
  const key = `ratelimit:${identifier}:${Math.floor(now / windowMs)}`;

  const redis = getRedisClient();
  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSec + 1);
      }
      return {
        allowed: current <= limit,
        limit,
        remaining: Math.max(limit - current, 0),
        resetAt: Math.floor(now / windowMs) * windowMs + windowMs,
      };
    } catch {
      // Fall through to in-memory if Redis fails
    }
  }

  // Fallback to in-memory
  const entry = fallbackRateLimitStore.get(key);
  if (!entry || entry.resetAt <= now) {
    fallbackRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Validate and sanitize email address
 * Simple but effective validation without heavy regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > LIMITS.MAX_EMAIL_LENGTH) return false;

  // Basic email validation: must have @, at least one char before and after
  // Format: local@domain.tld
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;

  if (!local || !domain) return false;
  if (local.length === 0 || domain.length === 0) return false;
  if (!domain.includes(".")) return false;

  // No spaces or control characters
  if (/[\s\x00-\x1F\x7F]/.test(trimmed)) return false;

  return true;
}

/**
 * Validate text input length
 */
export function validateTextLength(
  text: string,
  maxLen: number = LIMITS.MAX_TEXT_LENGTH,
): boolean {
  return typeof text === "string" && text.length <= maxLen;
}

/**
 * Validate file size
 */
export function validateImageSize(file: File): boolean {
  return file.size <= LIMITS.MAX_IMAGE_SIZE_BYTES;
}

/**
 * Constant-time string comparison for tokens/secrets
 * Prevents timing attacks
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Sanitize string input by trimming and removing null bytes
 * Also removes control characters except newlines and tabs
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Sanitize JSON string to prevent injection attacks
 */
export function sanitizeJsonString(input: string): string {
  return sanitizeString(input).replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Validate and sanitize file type
 * Only allows image MIME types
 */
export function validateImageType(file: File): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  return allowedTypes.includes(file.type.toLowerCase());
}

/**
 * Validate file content by checking magic bytes
 * Prevents MIME type spoofing attacks
 */
export async function validateImageContent(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 12));

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    return true;
  }

  // GIF: 47 49 46 38 (GIF8)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return true;
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return true;
  }

  return false;
}

/**
 * Device fingerprinting for guest quota enforcement
 * Generates a stable identifier from request headers
 */
export function generateDeviceFingerprint(request: Request): string {
  const userAgent = request.headers.get("user-agent") || "";
  const acceptLanguage = request.headers.get("accept-language") || "";
  const acceptEncoding = request.headers.get("accept-encoding") || "";

  // Simple hash combination (not cryptographically secure, but sufficient for quota)
  const combined = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Rate limit headers for NextResponse
 */
export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
}

export function createRateLimitHeaders(
  result: RateLimitResult,
): RateLimitHeaders {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toString(),
  };
}

/**
 * Standardized API error response
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generate nonce for inline scripts
 * MUST be called server-side and passed to client components
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Strict CSP for API routes - no inline scripts allowed
 * API routes should not need inline scripts at all
 */
export function getApiCspHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": [
      `default-src 'none'`,
      `script-src 'none'`,
      `style-src 'none'`,
      `img-src 'none'`,
      `font-src 'none'`,
      `connect-src 'self' https://*.supabase.co https://api.openai.com https://api.resend.com`,
      `frame-ancestors 'none'`,
      `base-uri 'none'`,
      `form-action 'none'`,
    ].join("; "),
  };
}

/**
 * Generate CSP header for page routes with nonce
 * nonce parameter must be generated server-side per request
 */
export function getPageCspHeaders(nonce: string): Record<string, string> {
  const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io";
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  // Build script-src with nonce for external analytics
  const scriptSrcParts = ["'self'", `'nonce-${nonce}'`];

  // Add Google Analytics if configured
  if (process.env.NEXT_PUBLIC_GA_ID) {
    scriptSrcParts.push("https://www.googletagmanager.com");
  }

  // Add Plausible Analytics if configured
  if (plausibleDomain && plausibleSrc) {
    try {
      const plausibleOrigin = new URL(plausibleSrc).origin;
      scriptSrcParts.push(plausibleOrigin);
    } catch {
      // Invalid URL, skip
    }
  }

  const scriptSrc = scriptSrcParts.join(" ");

  return {
    "Content-Security-Policy": [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src 'self' 'nonce-${nonce}'`, // For inline styles
      `img-src 'self' data: https: blob:`,
      `font-src 'self' data:`,
      `connect-src 'self' https://*.supabase.co https://api.openai.com https://api.resend.com ${plausibleSrc}`,
      `frame-src 'none'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `object-src 'none'`,
      `report-uri /api/security/csp-report`,
    ].join("; "),
  };
}

/**
 * Legacy function for API routes - redirects to strict version
 * @deprecated Use getApiCspHeaders for API routes
 */
export function getCspHeaders(): Record<string, string> {
  return getApiCspHeaders();
}

/**
 * Security response headers for API routes
 * Uses strict CSP without unsafe-inline/unsafe-eval
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    ...getApiCspHeaders(),
  };
}

/**
 * Legacy constant for backward compatibility
 * @deprecated Use getSecurityHeaders() function instead
 */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  ...getApiCspHeaders(),
} as const;

/**
 * Generate CSRF token for state-changing operations
 * Uses crypto.randomBytes for secure token generation
 */
export async function generateCsrfToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate CSRF token from request headers
 * Token should be passed in X-CSRF-Token header
 */
export async function validateCsrfToken(
  request: Request,
  expectedToken: string,
): Promise<boolean> {
  const providedToken = request.headers.get("X-CSRF-Token");
  if (!providedToken) return false;
  return constantTimeEqual(providedToken, expectedToken);
}
