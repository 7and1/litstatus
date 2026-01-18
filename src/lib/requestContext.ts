/**
* Request context for distributed tracing and structured logging
* P2 Production Backend - Request ID Tracing & Structured Logging
*/

import { getRedisClient } from "./redis";

// Request ID storage (AsyncLocal for Node, but we use a simpler approach for Edge)
const requestContextStore = new Map<string, RequestContext>();

interface RequestContext {
  requestId: string;
  timestamp: number;
  userId?: string;
  ip?: string;
  path?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  requestId: string;
  timestamp: number;
  userId?: string;
  ip?: string;
  path?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
* Generate a unique request ID using crypto API
*/
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timestamp + "-" + random;
}

/**
* Extract or create request ID from headers
*/
export function getRequestIdFromRequest(request: Request): string {
  const existing = request.headers.get("X-Request-ID");
  if (existing && existing.length > 0 && existing.length < 128) {
    return existing;
  }
  return generateRequestId();
}

/**
* Set request context for the current request
*/
export function setRequestContext(context: RequestContext): void {
  requestContextStore.set(context.requestId, context);
}

/**
* Get request context by request ID
*/
export function getRequestContext(requestId: string): RequestContext | undefined {
  return requestContextStore.get(requestId);
}

/**
* Clean up request context (call after response)
*/
export function clearRequestContext(requestId: string): void {
  requestContextStore.delete(requestId);
}

/**
* Structured logging function
*/
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify({
    level: entry.level,
    msg: entry.message,
    request_id: entry.requestId,
    ts: new Date(entry.timestamp).toISOString(),
    user_id: entry.userId,
    ip: entry.ip,
    path: entry.path,
    ...entry.metadata,
    ...(entry.error && {
      error: {
        name: entry.error.name,
        msg: entry.error.message,
        ...(entry.error.stack && { stack: entry.error.stack }),
      },
    }),
  });
}

/**
* Async log to Redis for distributed log aggregation
*/
async function logToRedis(entry: LogEntry): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = "logs:" + entry.level + ":" + Date.now() + ":" + entry.requestId;
    await redis.set(key, formatLogEntry(entry), { ex: 86400 });
  } catch {
    // Silently fail - logging should not break the app
  }
}

/**
* Log a message with structured context
*/
export function logStructured(
  level: LogEntry["level"],
  message: string,
  context: {
    requestId: string;
    userId?: string | null;
    ip?: string | null;
    path?: string;
    metadata?: Record<string, unknown>;
    error?: Error;
  }
): void {
  const entry: LogEntry = {
    level,
    message,
    requestId: context.requestId,
    timestamp: Date.now(),
    userId: context.userId || undefined,
    ip: context.ip || undefined,
    path: context.path,
    metadata: context.metadata,
    ...(context.error && {
      error: {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack,
      },
    }),
  };

  const formatted = formatLogEntry(entry);

  const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleMethod(formatted);

  void logToRedis(entry);
}

export const logger = {
  info: (message: string, context: { requestId: string; userId?: string | null; ip?: string | null; path?: string; metadata?: Record<string, unknown>; error?: Error }) =>
    logStructured("info", message, { ...context, userId: context.userId || undefined, ip: context.ip || undefined }),
  warn: (message: string, context: { requestId: string; userId?: string | null; ip?: string | null; path?: string; metadata?: Record<string, unknown>; error?: Error }) =>
    logStructured("warn", message, { ...context, userId: context.userId || undefined, ip: context.ip || undefined }),
  error: (message: string, context: { requestId: string; userId?: string | null; ip?: string | null; path?: string; metadata?: Record<string, unknown>; error?: Error }) =>
    logStructured("error", message, { ...context, userId: context.userId || undefined, ip: context.ip || undefined }),
  debug: (message: string, context: { requestId: string; userId?: string | null; ip?: string | null; path?: string; metadata?: Record<string, unknown>; error?: Error }) =>
    logStructured("debug", message, { ...context, userId: context.userId || undefined, ip: context.ip || undefined }),
};

/**
* Create response headers with request ID
*/
export function createResponseHeaders(requestId: string, additional?: Record<string, string>): Record<string, string> {
  return {
    "X-Request-ID": requestId,
    ...(additional || {}),
  };
}

