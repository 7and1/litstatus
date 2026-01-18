/**
 * API Security Middleware
 * Comprehensive security layer for all API routes
 */

import { NextResponse } from "next/server";
import { getUserFromRequest } from "./auth";
import { getClientIp } from "./ip";
import { checkRateLimit, createRateLimitHeaders, generateDeviceFingerprint, SECURITY_HEADERS } from "./security";
import { logSecurityEvent } from "./securityEvents";

export interface SecurityContext {
  user: Awaited<ReturnType<typeof getUserFromRequest>>;
  ip: ReturnType<typeof getClientIp>;
  fingerprint: string;
}

/**
 * Initialize security context for a request
 * Extracts user, IP, and device fingerprint
 */
export async function initSecurityContext(request: Request): Promise<SecurityContext> {
  const user = await getUserFromRequest(request);
  const ip = getClientIp(request);
  const fingerprint = generateDeviceFingerprint(request);

  return { user, ip, fingerprint };
}

/**
 * Apply rate limiting with security context
 */
export async function applyRateLimit(
  context: SecurityContext,
  limit: number,
  windowMs: number,
  request: Request
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const identifier = context.user?.id ?? context.fingerprint ?? context.ip ?? "unknown";
  const result = await checkRateLimit(identifier, limit, windowMs);

  if (!result.allowed) {
    await logSecurityEvent({
      event_type: "rate_limited",
      severity: "warn",
      user_id: context.user?.id ?? null,
      ip: context.ip ?? null,
      path: new URL(request.url).pathname,
      user_agent: request.headers.get("user-agent"),
      meta: { limit, fingerprint: context.fingerprint },
    });
  }

  return {
    allowed: result.allowed,
    headers: createRateLimitHeaders(result) as unknown as Record<string, string>,
  };
}

/**
 * Create standardized security error response
 */
export function securityErrorResponse(
  error: string,
  status: number,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(
    { error },
    {
      status,
      headers: { ...SECURITY_HEADERS, ...additionalHeaders },
    }
  );
}

/**
 * Validate required environment variables
 */
export function validateEnv(requiredVars: string[]): { valid: boolean; missing: string[] } {
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitize URL path parameter
 */
export function sanitizePathParam(param: string): string {
  // Remove any path traversal attempts
  return param.replace(/(\.\.|\/|\\)/g, "").slice(0, 100);
}

/**
 * Validate request origin for sensitive operations
 */
export function validateOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    return allowedOrigins.some((allowed) => {
      const allowedUrl = new URL(allowed);
      return originUrl.origin === allowedUrl.origin;
    });
  } catch {
    return false;
  }
}

/**
 * Rate limit configurations for different API endpoints
 */
export const RATE_LIMITS = {
  generate: { limit: 40, windowMs: 60 * 1000 }, // 40 per minute
  events: { limit: 120, windowMs: 60 * 1000 }, // 120 per minute
  wishlist: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
  feedback: { limit: 20, windowMs: 60 * 1000 }, // 20 per minute
  quota: { limit: 60, windowMs: 60 * 1000 }, // 60 per minute
  admin: { limit: 30, windowMs: 60 * 1000 }, // 30 per minute
} as const;

/**
 * Wrapper for API routes with automatic security
 */
export async function withSecurity<T>(
  request: Request,
  handler: (context: SecurityContext) => Promise<T>,
  options?: {
    rateLimit?: keyof typeof RATE_LIMITS;
    requireAuth?: boolean;
    allowCors?: boolean;
  }
): Promise<NextResponse> {
  try {
    const context = await initSecurityContext(request);

    // Check authentication if required
    if (options?.requireAuth && !context.user) {
      return securityErrorResponse("Authentication required", 401);
    }

    // Apply rate limiting
    if (options?.rateLimit) {
      const { limit, windowMs } = RATE_LIMITS[options.rateLimit];
      const rateLimitResult = await applyRateLimit(context, limit, windowMs, request);

      if (!rateLimitResult.allowed) {
        return securityErrorResponse("Too many requests", 429, rateLimitResult.headers);
      }
    }

    // Execute handler
    const result = await handler(context);

    // Return response
    if (result instanceof NextResponse) {
      return result;
    }

    return NextResponse.json(result, { headers: SECURITY_HEADERS });
  } catch (error) {
    console.error("[API Security Error]", error);
    await logSecurityEvent({
      event_type: "api_security_error",
      severity: "error",
      user_id: null,
      ip: getClientIp(request),
      path: new URL(request.url).pathname,
      user_agent: request.headers.get("user-agent"),
      meta: { message: error instanceof Error ? error.message : "unknown" },
    });
    return securityErrorResponse("Internal server error", 500);
  }
}
