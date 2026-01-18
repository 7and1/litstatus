export type ErrorCode =
  | "UNKNOWN_ERROR"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "RATE_LIMIT_ERROR"
  | "QUOTA_EXCEEDED"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT_ERROR"
  | "PARSE_ERROR"
  | "STORAGE_ERROR"
  | "CACHE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "INVALID_INPUT";

export interface AppError extends Error {
  code: ErrorCode;
  statusCode?: number;
  context?: Record<string, unknown>;
  userMessage?: string;
  timestamp: number;
  recoverable: boolean;
}

export interface ErrorContext {
  userId?: string | null;
  sessionId?: string;
  path?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export interface ErrorLogEntry {
  error: AppError;
  context: ErrorContext;
  level: "error" | "warn" | "info";
}
