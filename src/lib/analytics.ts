export type AnalyticsProps = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: AnalyticsProps }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;

  if (window.plausible) {
    window.plausible(event, props ? { props } : undefined);
  }

  if (window.gtag) {
    window.gtag("event", event, props ?? {});
  }
}

function sendEventPayload(event: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({ event, props });
  const endpoint = "/api/events";

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => null);
}

export function trackFunnelEvent(event: string, props?: AnalyticsProps) {
  trackEvent(event, props);
  sendEventPayload(event, props);
}

export type LogLevel = "error" | "warn" | "info";

function shouldLog(level: LogLevel): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  return process.env.NODE_ENV === "development";
}

export function logServerEvent(
  level: LogLevel,
  context: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  if (!shouldLog(level)) return;

  const logEntry = {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (typeof window === "undefined") {
    if (level === "error") {
      console.error(JSON.stringify(logEntry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
}

export function logError(context: string, message: string, error?: unknown) {
  const meta = error instanceof Error ? { error: error.message, stack: error.stack } : {};
  logServerEvent("error", context, message, meta);
}

export function logWarn(context: string, message: string, meta?: Record<string, unknown>) {
  logServerEvent("warn", context, message, meta);
}

export function logInfo(context: string, message: string, meta?: Record<string, unknown>) {
  logServerEvent("info", context, message, meta);
}
