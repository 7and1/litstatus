import { Redis } from "@upstash/redis";
import { withTiming, perfMonitor } from "./performance";

let redisClient: Redis | null = null;
let redisErrorCount = 0;
const MAX_REDIS_ERRORS = 10;
const REDIS_ERROR_RESET_TIME = 60000; // 1 minute
let lastRedisErrorTime = 0;

function shouldUseRedis(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  // Check if we've had too many recent errors
  const now = Date.now();
  if (
    redisErrorCount >= MAX_REDIS_ERRORS &&
    now - lastRedisErrorTime < REDIS_ERROR_RESET_TIME
  ) {
    console.warn("[REDIS] Too many errors, temporarily disabling Redis");
    return false;
  }

  // Reset error count if enough time has passed
  if (now - lastRedisErrorTime > REDIS_ERROR_RESET_TIME) {
    redisErrorCount = 0;
  }

  return true;
}

function handleRedisError(error: unknown) {
  redisErrorCount++;
  lastRedisErrorTime = Date.now();
  console.error("[REDIS] Error:", error);
}

export function getRedisClient(): Redis | null {
  if (!shouldUseRedis()) return null;

  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return null;

    try {
      redisClient = new Redis({
        url,
        token,
        // Enable automatic retries
        retry: {
          retries: 2,
          backoff: (retryCount) => Math.pow(2, retryCount) * 100,
        },
      });
    } catch (error) {
      handleRedisError(error);
      return null;
    }
  }

  return redisClient;
}

// Wrapper for Redis operations with monitoring
export async function redisOperation<T>(
  operation: string,
  fn: (client: Redis) => Promise<T>
): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    return await withTiming(`redis.${operation}`, () => fn(client!));
  } catch (error) {
    handleRedisError(error);
    return null;
  }
}

// Get Redis stats for monitoring
export function getRedisStats() {
  return {
    enabled: !!redisClient,
    errorCount: redisErrorCount,
    lastErrorTime: lastRedisErrorTime,
  };
}
