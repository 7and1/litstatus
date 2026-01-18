import { getRedisClient } from "./redis";
import { withTiming } from "./performance";

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  tags: string[];
}

const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  invalidations: 0,
};

export function getCacheStats() {
  return { ...cacheStats };
}

export function resetCacheStats() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.sets = 0;
  cacheStats.deletes = 0;
  cacheStats.invalidations = 0;
}

export async function cacheGet<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  return withTiming("cache.get", async () => {
    const redis = getRedisClient();
    if (!redis) {
      cacheStats.misses++;
      return null;
    }

    try {
      const raw = await redis.get<string>(key);
      if (!raw) {
        cacheStats.misses++;
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(raw);
      cacheStats.hits++;
      return entry.data;
    } catch (error) {
      console.error("[CACHE] Get error:", error);
      cacheStats.misses++;
      return null;
    }
  }, { key });
}

export async function cacheSet<T>(
  key: string,
  data: T,
  options?: CacheOptions
): Promise<void> {
  return withTiming("cache.set", async () => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        tags: options?.tags || [],
      };

      const ttl = options?.ttl || 3600;
      await redis.set(key, JSON.stringify(entry), { ex: ttl });
      cacheStats.sets++;
    } catch (error) {
      console.error("[CACHE] Set error:", error);
    }
  }, { key });
}

export async function cacheDelete(key: string): Promise<void> {
  return withTiming("cache.delete", async () => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.del(key);
      cacheStats.deletes++;
    } catch (error) {
      console.error("[CACHE] Delete error:", error);
    }
  }, { key });
}

export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  return withTiming("cache.wrap", async () => {
    const cached = await cacheGet<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await cacheSet(key, result, options);
    return result;
  }, { key });
}

export async function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>
): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => k + ":" + String(params[k]))
    .join("|");

  const encoder = new TextEncoder();
  const data = encoder.encode(sortedParams);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 16);

  return prefix + ":" + hash;
}

/**
 * Synchronous version of generateCacheKey using simple hash
 * Use when async is not possible
 */
export function generateCacheKeySync(
  prefix: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => k + ":" + String(params[k]))
    .join("|");

  // Simple hash function for sync use
  let hash = 0;
  for (let i = 0; i < sortedParams.length; i++) {
    const char = sortedParams.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return prefix + ":" + Math.abs(hash).toString(16);
}

export async function cacheClear(): Promise<void> {
  return withTiming("cache.clear", async () => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const keys = await redis.keys("cache:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      cacheStats.invalidations += keys.length;
    } catch (error) {
      console.error("[CACHE] Clear error:", error);
    }
  }, {});
}
