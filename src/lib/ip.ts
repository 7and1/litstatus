import { sanitizeString } from "./security";

/**
 * Private IP ranges that should never be accepted from proxy headers
 * Prevents IP spoofing via X-Forwarded-For / X-Real-IP headers
 */
const PRIVATE_IP_PATTERNS = [
  /^10\./,                           // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./,      // 172.16.0.0/12
  /^192\.168\./,                     // 192.168.0.0/16
  /^127\./,                          // 127.0.0.0/8 (loopback)
  /^0\./,                            // 0.0.0.0/8
  /^169\.254\./,                     // 169.254.0.0/16 (link-local)
  /^fc00:/i,                         // fc00::/7 (IPv6 private)
  /^fe80:/i,                         // fe80::/10 (IPv6 link-local)
  /^::1$/,                           // IPv6 loopback
  /^::$/,                            // IPv6 unspecified
];

/**
 * Localhost and special-use addresses to reject
 */
const LOCALHOST_ADDRESSES = new Set([
  "localhost",
  "localhost.localdomain",
  "[::1]",
]);

export function getClientIp(request: Request): string | null {
  // Try Cloudflare's CF-Connecting-IP first - most trusted for spoof protection
  // Cloudflare validates the IP before setting this header
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && isValidPublicIp(cfIp)) {
    return sanitizeString(cfIp);
  }

  // Try x-forwarded-for - only accept first IP if it's public
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first && isValidPublicIp(first)) {
      return sanitizeString(first);
    }
  }

  // Fallback to x-real-ip - only accept if public IP
  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidPublicIp(realIp)) {
    return sanitizeString(realIp);
  }

  // If no valid IP found in headers, return null
  // The caller should handle this appropriately (e.g., use device fingerprint instead)
  return null;
}

/**
 * Validate IP and ensure it's a public address
 * Rejects private, loopback, and reserved IPs to prevent spoofing
 */
function isValidPublicIp(ip: string): boolean {
  if (!isValidIp(ip)) {
    return false;
  }

  // Reject if matches any private IP pattern
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(ip)) {
      return false;
    }
  }

  return true;
}

function isValidIp(ip: string): boolean {
  // Reject empty, control chars, or suspiciously long strings
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  if (trimmed.length > 45) return false; // Max IPv6 length
  if (trimmed.length === 0) return false;
  if (/[\s\x00-\x1F\x7F]/.test(trimmed)) return false;

  // Reject localhost string variants
  if (LOCALHOST_ADDRESSES.has(trimmed.toLowerCase())) {
    return false;
  }

  // Basic IPv4 validation - prevents injection attacks
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(trimmed)) {
    const octets = trimmed.split(".");
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  // Allow basic IPv6 format (simplified validation)
  // Only allow hex digits, colons, and dots
  return /^[\da-fA-F:.]+$/.test(trimmed) && trimmed.includes(":");
}
