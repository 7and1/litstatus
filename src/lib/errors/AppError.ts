import type { AppError, ErrorCode } from "./types";

export function createAppError(
  code: ErrorCode,
  message: string,
  options: {
    statusCode?: number;
    context?: Record<string, unknown>;
    userMessage?: string;
    recoverable?: boolean;
    cause?: Error;
  } = {},
): AppError {
  const error = new Error(message) as AppError;
  error.name = "AppError";
  error.code = code;
  error.statusCode = options.statusCode;
  error.context = options.context;
  error.userMessage = options.userMessage || message;
  error.timestamp = Date.now();
  error.recoverable = options.recoverable ?? true;

  if (options.cause) {
    error.cause = options.cause;
  }

  return error;
}

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    "code" in error &&
    "timestamp" in error &&
    "recoverable" in error
  );
}

export function fromUnknownError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createAppError("UNKNOWN_ERROR", error.message, {
      cause: error,
      recoverable: true,
    });
  }

  return createAppError(
    "UNKNOWN_ERROR",
    typeof error === "string" ? error : "An unknown error occurred",
    {
      recoverable: true,
    },
  );
}
