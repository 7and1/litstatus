/**
 * Security utilities for P2 production level
 */

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

// Rate limiting state per IP
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Upstash Redis or similar
 */
export function checkRateLimit(
  ip: string,
  limit: number = 20, // requests per minute
  windowMs: number = 60 * 1000,
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt <= now) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
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
 */
export function sanitizeString(input: string): string {
  return input.replace(/\0/g, "").trim();
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
 * Security response headers
 */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
} as const;
