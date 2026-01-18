"use client";

import { logError } from "./logger";

export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault();
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logError(error, {
      type: "unhandledRejection",
      reason: event.reason,
    });
  });

  // Handle uncaught errors
  window.addEventListener("error", (event) => {
    logError(event.error || new Error(event.message), {
      type: "uncaughtError",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

export function cleanupGlobalErrorHandlers() {
  // Cleanup if needed in the future
}
