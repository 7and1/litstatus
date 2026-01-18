import OpenAI from "openai";
import { withTiming, perfMonitor } from "./performance";
import { withDistributedCircuitBreaker, getCircuitBreakerStats as getDistributedStats } from "./circuitBreaker";

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    timeout: DEFAULT_TIMEOUT,
    maxRetries: MAX_RETRIES,
  });
}

/**
 * Circuit breaker wrapper with Redis-backed distributed state
 * Falls back to in-memory if Redis is unavailable
 */
export async function withCircuitBreaker<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return withDistributedCircuitBreaker(operation, fn);
}

// Get circuit breaker stats for monitoring
export async function getCircuitBreakerStats(operation: string) {
  return getDistributedStats(operation);
}

// Reset circuit breaker (for admin/monitoring)
export async function resetCircuitBreaker(operation: string) {
  const { resetCircuitBreakerOperation } = await import("./circuitBreaker");
  await resetCircuitBreakerOperation(operation);
}
