import type { ErrorCode } from "./types";
import { createAppError, fromUnknownError } from "./AppError";
import { logError } from "./logger";

export function handleNetworkError(error: unknown, context?: Record<string, unknown>): Error {
  const appError = fromUnknownError(error);
  
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return createAppError("NETWORK_ERROR", "Network request failed", {
      statusCode: 0,
      context,
      userMessage: "Please check your internet connection",
      recoverable: true,
      cause: error,
    });
  }

  return appError;
}

export function handleResponseError(response: Response, body?: unknown): Error {
  let code: ErrorCode = "UNKNOWN_ERROR";
  let userMessage = "Something went wrong. Please try again.";

  switch (response.status) {
    case 400:
      code = "VALIDATION_ERROR";
      userMessage = "Invalid request. Please check your input.";
      break;
    case 401:
      code = "AUTHENTICATION_ERROR";
      userMessage = "Please sign in to continue.";
      break;
    case 403:
      code = "AUTHORIZATION_ERROR";
      userMessage = "You don't have permission to do this.";
      break;
    case 429:
      code = "RATE_LIMIT_ERROR";
      userMessage = "Too many requests. Please wait a moment.";
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      code = "SERVICE_UNAVAILABLE";
      userMessage = "Service temporarily unavailable. Please try again.";
      break;
    case 504:
      code = "TIMEOUT_ERROR";
      userMessage = "Request timed out. Please try again.";
      break;
  }

  const error = createAppError(code, `HTTP ${response.status}`, {
    statusCode: response.status,
    context: { body },
    userMessage,
    recoverable: response.status >= 500 || response.status === 429,
  });

  logError(error, { statusCode: response.status });
  return error;
}

export function handleValidationError(field: string, message: string): Error {
  return createAppError("VALIDATION_ERROR", `Validation failed for ${field}`, {
    userMessage: message,
    recoverable: true,
    context: { field },
  });
}

export function handleAuthError(message: string): Error {
  return createAppError("AUTHENTICATION_ERROR", message, {
    statusCode: 401,
    userMessage: "Please sign in to continue.",
    recoverable: true,
  });
}

export function handleQuotaError(quota: unknown): Error {
  return createAppError("QUOTA_EXCEEDED", "Daily quota exceeded", {
    statusCode: 429,
    context: { quota },
    userMessage: "You've reached your daily limit. Upgrade to Pro for unlimited access.",
    recoverable: false,
  });
}

export function handleTimeoutError(operation: string): Error {
  return createAppError("TIMEOUT_ERROR", `${operation} timed out`, {
    userMessage: "Request took too long. Please try again.",
    recoverable: true,
  });
}

export function handleParseError(data: unknown): Error {
  return createAppError("PARSE_ERROR", "Failed to parse response", {
    context: { data },
    userMessage: "Received invalid data from server.",
    recoverable: true,
  });
}
