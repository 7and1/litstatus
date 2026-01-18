import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/health/route";

// Mock dependencies
vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  })),
}));

vi.mock("@/lib/openai", () => ({
  getCircuitBreakerStats: vi.fn(() => ({
    isOpen: false,
    failureCount: 0,
    successCount: 10,
    lastFailureTime: 0,
  })),
  resetCircuitBreaker: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  getRedisStats: vi.fn(() => ({
    enabled: true,
    errorCount: 0,
    lastErrorTime: 0,
  })),
}));

vi.mock("@/lib/performance", () => ({
  perfMonitor: {
    getMetrics: vi.fn(() => []),
  },
}));

vi.mock("@/lib/cache", () => ({
  getCacheStats: vi.fn(() => ({
    hits: 100,
    misses: 10,
    sets: 50,
    deletes: 5,
    invalidations: 0,
  })),
}));

import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getCircuitBreakerStats } from "@/lib/openai";
import { getRedisStats } from "@/lib/redis";
import { perfMonitor } from "@/lib/performance";
import { getCacheStats } from "@/lib/cache";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return healthy status when all services are OK", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("healthy");
    expect(json.services.database.status).toBe("ok");
    expect(json.services.openai.status).toBe("ok");
    expect(json.services.redis.status).toBe("ok");
  });

  it("should return degraded status when circuit breaker has failures", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    vi.mocked(getCircuitBreakerStats).mockReturnValue({
      isOpen: false,
      failureCount: 3,
      successCount: 10,
      lastFailureTime: Date.now(),
    });

    const response = await GET();
    const json = await response.json();

    expect(json.status).toBe("degraded");
    expect(json.services.openai.status).toBe("degraded");
  });

  it("should return degraded status when circuit is open", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    vi.mocked(getCircuitBreakerStats).mockReturnValue({
      isOpen: true,
      failureCount: 10,
      successCount: 0,
      lastFailureTime: Date.now(),
    });

    const response = await GET();
    const json = await response.json();

    expect(json.status).toBe("degraded");
    expect(json.services.openai.status).toBe("circuit_open");
  });

  it("should return unhealthy status when database is down", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: new Error("Database connection failed"),
      }),
    } as any);

    const response = await GET();

    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.status).toBe("unhealthy");
    expect(json.services.database.status).toBe("error");
  });

  it("should include database latency", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { data: [], error: null };
      }),
    } as any);

    const response = await GET();
    const json = await response.json();

    expect(json.services.database.latency).toBeGreaterThanOrEqual(0);
  });

  it("should return degraded when database is slow", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return { data: [], error: null };
      }),
    } as any);

    const response = await GET();
    const json = await response.json();

    expect(json.status).toBe("degraded");
    expect(json.services.database.latency).toBeGreaterThan(500);
  });

  it("should include circuit breaker stats", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    const mockCircuitStats = {
      isOpen: false,
      failureCount: 1,
      successCount: 100,
      lastFailureTime: Date.now() - 10000,
    };
    vi.mocked(getCircuitBreakerStats).mockReturnValue(mockCircuitStats);

    const response = await GET();
    const json = await response.json();

    expect(json.services.openai.circuitBreaker).toEqual(mockCircuitStats);
  });

  it("should handle Redis disabled state", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    vi.mocked(getRedisStats).mockReturnValue({
      enabled: false,
      errorCount: 0,
      lastErrorTime: 0,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.services.redis.status).toBe("disabled");
  });

  it("should return degraded when Redis has errors", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    vi.mocked(getRedisStats).mockReturnValue({
      enabled: true,
      errorCount: 10,
      lastErrorTime: Date.now(),
    });

    const response = await GET();
    const json = await response.json();

    expect(json.status).toBe("degraded");
    expect(json.services.redis.status).toBe("degraded");
  });

  it("should include performance metrics", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    const mockMetrics = [
      { operation: "openai.chat", duration: 500, success: true },
      { operation: "redis.get", duration: 50, success: true },
      { operation: "db.query", duration: 2000, success: true },
    ];
    vi.mocked(perfMonitor.getMetrics).mockReturnValue(mockMetrics);

    const response = await GET();
    const json = await response.json();

    expect(json.performance.slowOperations).toBe(1); // Only the 2000ms one
    expect(json.performance.avgOpenaiLatency).toBe(500);
    expect(json.performance.openaiSuccessRate).toBe(1);
  });

  it("should include cache statistics", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    vi.mocked(getCacheStats).mockReturnValue({
      hits: 90,
      misses: 10,
      sets: 50,
      deletes: 5,
      invalidations: 0,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.performance.cacheStats.hits).toBe(90);
    expect(json.performance.cacheStats.misses).toBe(10);
    expect(json.performance.cacheStats.hitRate).toBe(0.9);
  });

  it("should include response time header", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    const response = await GET();

    const responseTime = response.headers.get("X-Response-Time");
    expect(responseTime).toBeDefined();
    expect(responseTime).toMatch(/\d+ms/);
  });

  it("should set cache control headers", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("no-store, must-revalidate");
  });

  it("should handle exceptions in database check gracefully", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        throw new Error("Unexpected error");
      }),
    } as any);

    const response = await GET();
    const json = await response.json();

    expect(json.status).toBe("unhealthy");
    expect(json.services.database.status).toBe("error");
  });
});
