/**
* Redis-backed circuit breaker for distributed state
* P2 Production Backend - Distributed Circuit Breaker
*/

import { getRedisClient } from "./redis";

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

export interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
  halfOpenAttempts: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  threshold: 5,
  timeout: 60000,
  halfOpenAttempts: 3,
} as const;

const CB_KEY_PREFIX = "circuit-breaker:";

function getCircuitBreakerKey(operation: string): string {
  return CB_KEY_PREFIX + operation;
}

/**
* Get circuit breaker state from Redis
*/
async function getCircuitBreakerState(
  operation: string
): Promise<CircuitBreakerState | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = getCircuitBreakerKey(operation);
    const data = await redis.get<string>(key);
    if (!data) return null;
    return JSON.parse(data) as CircuitBreakerState;
  } catch {
    return null;
  }
}

/**
* Save circuit breaker state to Redis
*/
async function saveCircuitBreakerState(
  operation: string,
  state: CircuitBreakerState
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = getCircuitBreakerKey(operation);
    await redis.set(key, JSON.stringify(state), { ex: 3600 });
  } catch {
    // Silently fail
  }
}

/**
* Increment circuit breaker failure count
*/
async function incrementFailure(operation: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;

  try {
    const key = getCircuitBreakerKey(operation) + ":failures";
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 3600);
    }
    return count;
  } catch {
    return 0;
  }
}

/**
* Reset circuit breaker for an operation
*/
async function resetCircuitBreaker(operation: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = getCircuitBreakerKey(operation);
    await redis.del(key, key + ":failures");
  } catch {
    // Silently fail
  }
}

/**
* Circuit breaker wrapper with Redis-backed state
* Supports distributed deployment across multiple instances
*/
export async function withDistributedCircuitBreaker<T>(
  operation: string,
  fn: () => Promise<T>,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config } as Required<CircuitBreakerConfig>;
  const now = Date.now();

  // Get current state from Redis
  let state = await getCircuitBreakerState(operation);

  // Initialize state if not exists
  if (!state) {
    state = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
    };
  }

  // Check if circuit should reset (timeout has passed)
  if (state.isOpen && now - state.lastFailureTime > cfg.timeout) {
    console.info("[CIRCUIT BREAKER] Attempting to close circuit for " + operation);
    state.isOpen = false;
    state.failureCount = 0;
    state.successCount = 0;
    await resetCircuitBreaker(operation);
  }

  // Reject if circuit is open
  if (state.isOpen) {
    const error = new Error(
      "Circuit breaker is open for " + operation + ". Too many recent failures."
    );
    (error as { status?: number }).status = 503;
    throw error;
  }

  try {
    const result = await fn();

    // Record success
    state.successCount++;

    // If we have had enough successes, reset failure count
    if (state.successCount >= cfg.halfOpenAttempts) {
      state.failureCount = Math.max(0, state.failureCount - 1);
    }

    await saveCircuitBreakerState(operation, state);
    return result;
  } catch (error) {
    const status = (error as { status?: number }).status;

    // Only count circuit breaker failures for specific status codes
    if (status && [429, 500, 502, 503, 504].includes(status)) {
      state.failureCount = await incrementFailure(operation);
      state.lastFailureTime = now;

      if (state.failureCount >= cfg.threshold) {
        state.isOpen = true;
        console.error(
          "[CIRCUIT BREAKER] Opening circuit for " + operation + " after " + state.failureCount + " failures"
        );
      }

      await saveCircuitBreakerState(operation, state);
    }

    throw error;
  }
}

/**
* Get circuit breaker stats for monitoring
*/
export async function getCircuitBreakerStats(
  operation: string
): Promise<CircuitBreakerState | null> {
  return getCircuitBreakerState(operation);
}

/**
* Manually reset circuit breaker (admin use)
*/
export async function resetCircuitBreakerOperation(operation: string): Promise<void> {
  await resetCircuitBreaker(operation);
}

/**
* Reset all circuit breakers (admin use)
*/
export async function resetAllCircuitBreakers(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(CB_KEY_PREFIX + "*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
}

