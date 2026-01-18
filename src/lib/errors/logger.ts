import type { AppError, ErrorContext, ErrorLogEntry } from "./types";
import { isAppError } from "./AppError";

const isDevelopment = process.env.NODE_ENV === "development";

class ErrorLogger {
  private queue: ErrorLogEntry[] = [];
  private maxQueueSize = 50;
  private flushInterval = 30000;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.startFlushTimer();
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  private startFlushTimer() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  private stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const entries = [...this.queue];
    this.queue = [];

    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "error_log",
          entries,
        }),
        keepalive: true,
      });
    } catch {
      // Silently fail
    }
  }

  private formatError(error: Error | AppError): string {
    if (isAppError(error)) {
      return "[" + error.code + "] " + error.message;
    }
    return error.message;
  }

  private formatContext(context: ErrorContext): string {
    const parts: string[] = [];
    if (context.userId) parts.push("user: " + context.userId);
    if (context.path) parts.push("path: " + context.path);
    return parts.join(" | ");
  }

  log(error: Error | AppError, context: ErrorContext = {}, level: "error" | "warn" | "info" = "error") {
    const entry: ErrorLogEntry = {
      error: isAppError(error) ? error : this.normalizeError(error),
      context,
      level,
    };

    if (isDevelopment) {
      const emoji = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
      const formatted = emoji + " " + this.formatError(entry.error);
      const ctx = this.formatContext(entry.context);
      
      if (level === "error") {
        console.error(formatted, ctx || "", entry.error);
      } else if (level === "warn") {
        console.warn(formatted, ctx || "");
      } else {
        console.log(formatted, ctx || "");
      }
    }

    this.queue.push(entry);
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  error(error: Error | AppError, context: ErrorContext = {}) {
    this.log(error, context, "error");
  }

  warn(error: Error | AppError, context: ErrorContext = {}) {
    this.log(error, context, "warn");
  }

  info(error: Error | AppError, context: ErrorContext = {}) {
    this.log(error, context, "info");
  }

  private normalizeError(error: Error): AppError {
    return {
      name: error.name,
      message: error.message,
      code: "UNKNOWN_ERROR",
      timestamp: Date.now(),
      recoverable: true,
      stack: error.stack,
    };
  }

  destroy() {
    this.stopFlushTimer();
    this.flush();
  }
}

let loggerInstance: ErrorLogger | null = null;

export function getLogger(): ErrorLogger {
  if (!loggerInstance) {
    loggerInstance = new ErrorLogger();
  }
  return loggerInstance;
}

export function logError(error: Error | AppError, context?: ErrorContext) {
  getLogger().error(error, context);
}

export function logWarn(error: Error | AppError, context?: ErrorContext) {
  getLogger().warn(error, context);
}

export function logInfo(error: Error | AppError, context?: ErrorContext) {
  getLogger().info(error, context);
}
