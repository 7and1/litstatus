import { sanitizeString } from "./security";

export function getClientIp(request: Request): string | null {
  // Try x-forwarded-for first (most common proxy header)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first && isValidIp(first)) return sanitizeString(first);
  }

  // Fallback to x-real-ip
  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp)) return sanitizeString(realIp);

  // Cloudflare specific header
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp)) return sanitizeString(cfIp);

  return null;
}

function isValidIp(ip: string): boolean {
  // Reject empty, control chars, or suspiciously long strings
  if (!ip || typeof ip !== "string") return false;
  if (ip.length > 45) return false; // Max IPv6 length
  if (/[\s\x00-\x1F\x7F]/.test(ip)) return false;

  // Basic IPv4 validation - prevents injection attacks
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const octets = ip.split(".");
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  // Allow basic IPv6 format (simplified validation)
  // Only allow hex digits, colons, and dots
  return /^[\da-fA-F:.]+$/.test(ip) && ip.includes(":");
}
