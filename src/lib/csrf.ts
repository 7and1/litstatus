/**
 * CSRF Protection utilities
 * Uses double-submit cookie pattern for state-changing operations
 */

import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Set CSRF token in HTTP-only cookie
 */
export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validate CSRF token from request
 * Compares token from header with token from cookie
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieToken = await getCsrfCookie();
  if (!cookieToken) return false;

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) return false;

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) return false;

  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Middleware to require CSRF validation for state-changing operations
 */
export async function requireCsrf(request: Request): Promise<{ valid: boolean; error?: string }> {
  const isValid = await validateCsrfToken(request);
  if (!isValid) {
    return {
      valid: false,
      error: "Invalid CSRF token. Please refresh the page and try again.",
    };
  }
  return { valid: true };
}
