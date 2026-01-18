/**
 * Request Signing with HMAC for Admin APIs
 * P0 Security: Prevents unauthorized access to admin endpoints
 * Edge Runtime compatible using Web Crypto API
 */

const SIGNATURE_HEADER = "X-Signature";
const TIMESTAMP_HEADER = "X-Timestamp";
const SIGNATURE_VERSION = "v1";

/**
 * Maximum allowed timestamp drift in seconds
 * Prevents replay attacks
 */
const MAX_TIMESTAMP_DRIFT_SECONDS = 300; // 5 minutes

/**
 * Convert string to ArrayBuffer
 */
function stringToArrayBuffer(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate HMAC signature for a request using Web Crypto API
 * @param secret The secret key used for signing
 * @param method HTTP method
 * @param path Request path
 * @param timestamp Unix timestamp in seconds
 * @param body Request body (stringified JSON or empty string)
 * @returns Hex-encoded HMAC signature
 */
export async function generateSignature(
  secret: string,
  method: string,
  path: string,
  timestamp: number,
  body: string = "",
): Promise<string> {
  const payload = `${SIGNATURE_VERSION}\n${method}\n${path}\n${timestamp}\n${body}`;

  const keyData = stringToArrayBuffer(secret);
  const payloadData = stringToArrayBuffer(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    payloadData as BufferSource,
  );

  return arrayBufferToHex(signature);
}

/**
 * Verify request signature
 * @param secret The secret key used for signing
 * @param method HTTP method
 * @param path Request path (without query string)
 * @param headers Request headers
 * @param body Request body (stringified JSON or empty string)
 * @returns true if signature is valid, false otherwise
 */
export async function verifySignature(
  secret: string,
  method: string,
  path: string,
  headers: Headers,
  body: string = "",
): Promise<{ valid: boolean; error?: string }> {
  // Get signature and timestamp from headers
  const signature = headers.get(SIGNATURE_HEADER);
  const timestampHeader = headers.get(TIMESTAMP_HEADER);

  if (!signature) {
    return { valid: false, error: "Missing signature header" };
  }

  if (!timestampHeader) {
    return { valid: false, error: "Missing timestamp header" };
  }

  // Parse timestamp
  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) {
    return { valid: false, error: "Invalid timestamp format" };
  }

  // Check timestamp drift to prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  const drift = Math.abs(now - timestamp);

  if (drift > MAX_TIMESTAMP_DRIFT_SECONDS) {
    return {
      valid: false,
      error: `Timestamp drift too large (${drift}s). Request rejected.`,
    };
  }

  // Generate expected signature
  const expectedSignature = await generateSignature(secret, method, path, timestamp, body);

  // Constant-time comparison to prevent timing attacks
  if (!constantTimeEqual(signature, expectedSignature)) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}

/**
 * Constant-time string comparison
 * Prevents timing attacks on signature verification
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate signed request headers for client-side requests
 * Useful for testing and internal service calls
 */
export async function generateSignedHeaders(
  secret: string,
  method: string,
  path: string,
  body: string = "",
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateSignature(secret, method, path, timestamp, body);

  return {
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: timestamp.toString(),
  };
}

/**
 * Middleware wrapper for admin endpoints requiring signature verification
 */
export async function requireSignedRequest(
  request: Request,
  secret: string,
): Promise<{ valid: boolean; error?: string }> {
  if (!secret) {
    return { valid: false, error: "Server configuration error" };
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Get body for signature calculation
  let body = "";
  if (method !== "GET" && method !== "HEAD") {
    try {
      const clonedRequest = request.clone();
      const jsonBody = await clonedRequest.json().catch(() => ({}));
      body = JSON.stringify(jsonBody);
    } catch {
      body = "";
    }
  }

  return verifySignature(secret, method, path, request.headers, body);
}

/**
 * Export header names for client use
 */
export const SIGNING_HEADERS = {
  SIGNATURE: SIGNATURE_HEADER,
  TIMESTAMP: TIMESTAMP_HEADER,
  VERSION: SIGNATURE_VERSION,
} as const;
