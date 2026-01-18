import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  withCache,
  cacheClear,
  generateCacheKey,
  getCacheStats,
  resetCacheStats,
} from "@/lib/cache";

// Mock redis module
vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    expire: vi.fn(),
  })),
}));

vi.mock("@/lib/performance", () => ({
  withTiming: vi.fn((name, fn) => fn()),
}));

import { getRedisClient } from "@/lib/redis";

describe("cache.ts", () => {
  let mockRedis: any;

  beforeEach(() => {
    vi.clearAllMocks();
    resetCacheStats();

    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      keys: vi.fn(),
      expire: vi.fn(),
    };
    vi.mocked(getRedisClient).mockReturnValue(mockRedis);
  });

  describe("getCacheStats", () => {
    it("should return initial stats", () => {
      const stats = getCacheStats();

      expect(stats).toEqual({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        invalidations: 0,
      });
    });
  });

  describe("resetCacheStats", () => {
    it("should reset stats to zero", () => {
      // Simulate some activity
      const stats = getCacheStats();
      stats.hits = 10;

      resetCacheStats();

      const resetStats = getCacheStats();
      expect(resetStats.hits).toBe(0);
      expect(resetStats.misses).toBe(0);
    });
  });

  describe("cacheGet", () => {
    it("should return null when Redis is not available", async () => {
      vi.mocked(getRedisClient).mockReturnValue(null);

      const result = await cacheGet("test-key");

      expect(result).toBeNull();
    });

    it("should return null on cache miss", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheGet("test-key");

      expect(result).toBeNull();
      expect(getCacheStats().misses).toBe(1);
    });

    it("should return parsed data on cache hit", async () => {
      const testData = { value: "test", count: 42 };
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ data: testData, timestamp: Date.now(), tags: [] })
      );

      const result = await cacheGet("test-key");

      expect(result).toEqual(testData);
      expect(getCacheStats().hits).toBe(1);
    });

    it("should handle invalid JSON gracefully", async () => {
      mockRedis.get.mockResolvedValue("invalid json");

      const result = await cacheGet("test-key");

      expect(result).toBeNull();
      expect(getCacheStats().misses).toBe(1);
    });

    it("should handle Redis errors", async () => {
      mockRedis.get.mockRejectedValue(new Error("Redis error"));

      const result = await cacheGet("test-key");

      expect(result).toBeNull();
      expect(getCacheStats().misses).toBe(1);
    });
  });

  describe("cacheSet", () => {
    it("should set cache entry with default TTL", async () => {
      await cacheSet("test-key", { data: "value" });

      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        expect.stringContaining('"data":"value"'),
        { ex: 3600 }
      );
      expect(getCacheStats().sets).toBe(1);
    });

    it("should set cache entry with custom TTL", async () => {
      await cacheSet("test-key", { data: "value" }, { ttl: 7200 });

      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        expect.any(String),
        { ex: 7200 }
      );
    });

    it("should include tags in cache entry", async () => {
      await cacheSet("test-key", { data: "value" }, { tags: ["tag1", "tag2"] });

      const entry = JSON.parse(
        vi.mocked(mockRedis.set).mock.calls[0][1] as string
      );
      expect(entry.tags).toEqual(["tag1", "tag2"]);
    });

    it("should include timestamp in cache entry", async () => {
      const beforeTime = Date.now();
      await cacheSet("test-key", { data: "value" });
      const afterTime = Date.now();

      const entry = JSON.parse(
        vi.mocked(mockRedis.set).mock.calls[0][1] as string
      );
      expect(entry.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(entry.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedis.set.mockRejectedValue(new Error("Redis error"));

      await expect(cacheSet("test-key", { data: "value" })).resolves.toBeUndefined();
    });

    it("should return early when Redis is not available", async () => {
      vi.mocked(getRedisClient).mockReturnValue(null);

      await cacheSet("test-key", { data: "value" });

      expect(getCacheStats().sets).toBe(0);
    });
  });

  describe("cacheDelete", () => {
    it("should delete cache entry", async () => {
      await cacheDelete("test-key");

      expect(mockRedis.del).toHaveBeenCalledWith("test-key");
      expect(getCacheStats().deletes).toBe(1);
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedis.del.mockRejectedValue(new Error("Redis error"));

      await expect(cacheDelete("test-key")).resolves.toBeUndefined();
    });

    it("should return early when Redis is not available", async () => {
      vi.mocked(getRedisClient).mockReturnValue(null);

      await cacheDelete("test-key");

      expect(getCacheStats().deletes).toBe(0);
    });
  });

  describe("withCache", () => {
    it("should return cached value when available", async () => {
      const cachedData = { result: "cached" };
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ data: cachedData, timestamp: Date.now(), tags: [] })
      );

      const fetchFn = vi.fn().mockResolvedValue({ result: "fresh" });
      const result = await withCache("test-key", fetchFn);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("should call fetch function and cache result on miss", async () => {
      mockRedis.get.mockResolvedValue(null);
      const freshData = { result: "fresh" };
      const fetchFn = vi.fn().mockResolvedValue(freshData);

      const result = await withCache("test-key", fetchFn);

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalledOnce();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it("should propagate fetch function errors", async () => {
      mockRedis.get.mockResolvedValue(null);
      const fetchFn = vi.fn().mockRejectedValue(new Error("Fetch error"));

      await expect(withCache("test-key", fetchFn)).rejects.toThrow("Fetch error");
    });
  });

  describe("generateCacheKey", () => {
    it("should generate consistent keys for same params", () => {
      const params = { userId: "123", lang: "en" };
      const key1 = generateCacheKey("prefix", params);
      const key2 = generateCacheKey("prefix", params);

      expect(key1).toBe(key2);
    });

    it("should generate different keys for different params", () => {
      const key1 = generateCacheKey("prefix", { userId: "123" });
      const key2 = generateCacheKey("prefix", { userId: "456" });

      expect(key1).not.toBe(key2);
    });

    it("should generate keys regardless of param order", () => {
      const key1 = generateCacheKey("prefix", { a: "1", b: "2" });
      const key2 = generateCacheKey("prefix", { b: "2", a: "1" });

      expect(key1).toBe(key2);
    });

    it("should use prefix in key", () => {
      const key = generateCacheKey("test:", { id: "123" });

      expect(key).toContain("test:");
    });

    it("should use hash of params", () => {
      const key = generateCacheKey("prefix", { userId: "123" });

      // Key should end with 16 character hex hash
      expect(key).toMatch(/^prefix:[a-f0-9]{16}$/);
    });
  });

  describe("cacheClear", () => {
    it("should clear all cache entries", async () => {
      mockRedis.keys.mockResolvedValue(["cache:key1", "cache:key2", "cache:key3"]);

      await cacheClear();

      expect(mockRedis.keys).toHaveBeenCalledWith("cache:*");
      expect(mockRedis.del).toHaveBeenCalledWith("cache:key1", "cache:key2", "cache:key3");
      expect(getCacheStats().invalidations).toBe(3);
    });

    it("should handle empty cache", async () => {
      mockRedis.keys.mockResolvedValue([]);

      await cacheClear();

      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(getCacheStats().invalidations).toBe(0);
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedis.keys.mockRejectedValue(new Error("Redis error"));

      await expect(cacheClear()).resolves.toBeUndefined();
    });
  });
});
