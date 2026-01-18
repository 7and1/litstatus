import { createAppError } from "./AppError";
import { logError } from "./logger";

export function getFallbackValue<T>(fallback: T, error?: Error): T {
  if (error) {
    logError(error, { usingFallback: true });
  }
  return fallback;
}

export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const appError = error instanceof Error ? error : new Error(String(error));
    logError(appError, { 
      context: context || "withFallback",
      usingFallback: true 
    });
    return fallback;
  }
}

export function createCachedFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  ttlMs: number = 60000,
): () => Promise<T> {
  let cachedValue: T | null = null;
  let cacheTime: number | null = null;

  return async () => {
    const now = Date.now();
    
    if (cachedValue && cacheTime && now - cacheTime < ttlMs) {
      return cachedValue;
    }

    try {
      const value = await fn();
      cachedValue = value;
      cacheTime = now;
      return value;
    } catch (error) {
      if (cachedValue) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          usingCachedFallback: true,
          cacheAge: now - (cacheTime || 0),
        });
        return cachedValue;
      }
      
      logError(error instanceof Error ? error : new Error(String(error)), {
        usingStaticFallback: true,
      });
      return fallback;
    }
  };
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: "JSON.parse",
      usingFallback: true,
    });
    return fallback;
  }
}

export function safeStringify(value: unknown, fallback: string): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: "JSON.stringify",
      usingFallback: true,
    });
    return fallback;
  }
}
