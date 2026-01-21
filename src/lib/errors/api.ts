import { handleResponseError, handleNetworkError, handleTimeoutError } from "./handlers";
import { withRetry } from "./retry";
import { logError } from "./logger";

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  skipRetry?: boolean;
}

export async function safeFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 30000, retries = 2, skipRetry = false, ...fetchOptions } = options;

  const executeFetch = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
        throw handleResponseError(response, body);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw handleTimeoutError("fetch");
      }

      throw handleNetworkError(error);
    }
  };

  try {
    if (skipRetry) {
      return await executeFetch();
    }
    return await withRetry(executeFetch, {
      maxAttempts: retries + 1,
      baseDelay: 300,
      shouldRetry: (error) => {
        const status = (error as { statusCode?: number }).statusCode;
        return !status || status >= 500 || status === 429;
      },
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { url, method: fetchOptions.method });
    throw error;
  }
}

export async function safeJsonFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await safeFetch(url, options);

  try {
    return await response.json();
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      url,
      operation: "jsonParse",
    });
    throw error;
  }
}

export function createApiError(message: string, status: number = 500): Error {
  const error = new Error(message);
  (error as Error & { statusCode: number; code: string }).statusCode = status;
  (error as Error & { statusCode: number; code: string }).code = "API_ERROR";
  return error;
}
