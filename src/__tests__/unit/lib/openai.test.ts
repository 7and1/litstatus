import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getOpenAIClient,
  withCircuitBreaker,
  getCircuitBreakerStats,
  resetCircuitBreaker,
} from "@/lib/openai";
import OpenAI from "openai";

// Mock OpenAI
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe("openai.ts", () => {
  beforeEach(() => {
    // Reset circuit breaker before each test
    resetCircuitBreaker();
    vi.clearAllMocks();
  });

  describe("getOpenAIClient", () => {
    it("should throw error when OPENAI_API_KEY is missing", () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => getOpenAIClient()).toThrow("Missing OPENAI_API_KEY");
    });

    it("should create OpenAI client with API key", () => {
      process.env.OPENAI_API_KEY = "test-key";

      const client = getOpenAIClient();

      expect(client).toBeInstanceOf(OpenAI);
    });

    it("should use custom base URL if provided", () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.OPENAI_BASE_URL = "https://custom.openai.com";

      const client = getOpenAIClient();

      expect(client).toBeInstanceOf(OpenAI);
    });
  });

  describe("withCircuitBreaker", () => {
    it("should execute successful operation", async () => {
      const mockFn = vi.fn().mockResolvedValue("result");

      const result = await withCircuitBreaker("test-operation", mockFn);

      expect(result).toBe("result");
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it("should track successes in circuit breaker stats", async () => {
      const mockFn = vi.fn().mockResolvedValue("result");

      await withCircuitBreaker("test-operation", mockFn);
      const stats = getCircuitBreakerStats();

      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(0);
      expect(stats.isOpen).toBe(false);
    });

    it("should open circuit after threshold failures (429, 500, 502, 503, 504)", async () => {
      const error = new Error("Rate limited") as Error & { status?: number };
      error.status = 429;

      const mockFn = vi.fn().mockRejectedValue(error);

      // Circuit breaker threshold is 5
      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker("test-operation", mockFn);
        } catch {
          // Expected to fail
        }
      }

      const stats = getCircuitBreakerStats();
      expect(stats.isOpen).toBe(true);
      expect(stats.failureCount).toBe(5);
    });

    it("should reject requests when circuit is open", async () => {
      const error = new Error("Service unavailable") as Error & { status?: number };
      error.status = 503;

      const mockFn = vi.fn().mockRejectedValue(error);

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker("test-operation", mockFn);
        } catch {
          // Expected to fail
        }
      }

      // Try to execute while circuit is open
      await expect(
        withCircuitBreaker("test-operation", mockFn)
      ).rejects.toThrow("Circuit breaker is open");

      const stats = getCircuitBreakerStats();
      expect(stats.isOpen).toBe(true);
    });

    it("should not open circuit for non-retryable status codes", async () => {
      const error = new Error("Not found") as Error & { status?: number };
      error.status = 404;

      const mockFn = vi.fn().mockRejectedValue(error);

      // Try many times with 404 errors
      for (let i = 0; i < 10; i++) {
        try {
          await withCircuitBreaker("test-operation", mockFn);
        } catch {
          // Expected to fail
        }
      }

      const stats = getCircuitBreakerStats();
      expect(stats.isOpen).toBe(false);
      expect(stats.failureCount).toBe(0);
    });

    it("should not count errors without status code", async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error("Generic error"));

      for (let i = 0; i < 10; i++) {
        try {
          await withCircuitBreaker("test-operation", mockFn);
        } catch {
          // Expected to fail
        }
      }

      const stats = getCircuitBreakerStats();
      expect(stats.isOpen).toBe(false);
      expect(stats.failureCount).toBe(0);
    });

    it("should close circuit after timeout period", async () => {
      const error = new Error("Service unavailable") as Error & { status?: number };
      error.status = 503;

      const mockFail = vi.fn().mockRejectedValue(error);
      const mockSuccess = vi.fn().mockResolvedValue("result");

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker("test-operation", mockFail);
        } catch {
          // Expected to fail
        }
      }

      // Mock time passage (circuit breaker timeout is 60 seconds)
      vi.spyOn(Date, "now").mockReturnValue(
        Date.now() + 60 * 1000 + 1000
      );

      // Circuit should close and allow request
      const result = await withCircuitBreaker("test-operation", mockSuccess);
      expect(result).toBe("result");

      const stats = getCircuitBreakerStats();
      expect(stats.isOpen).toBe(false);
    });

    it("should decrease failure count after successful requests in half-open state", async () => {
      const error = new Error("Service unavailable") as Error & { status?: number };
      error.status = 503;

      const mockFail = vi.fn().mockRejectedValue(error);
      const mockSuccess = vi.fn().mockResolvedValue("result");

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker("test-operation", mockFail);
        } catch {
          // Expected to fail
        }
      }

      let stats = getCircuitBreakerStats();
      expect(stats.failureCount).toBe(5);

      // Mock time passage
      vi.spyOn(Date, "now").mockReturnValue(
        Date.now() + 60 * 1000 + 1000
      );

      // Successful requests should decrease failure count
      // Half-open attempts is 3, so we need 3 successes
      for (let i = 0; i < 3; i++) {
        await withCircuitBreaker("test-operation", mockSuccess);
      }

      stats = getCircuitBreakerStats();
      expect(stats.failureCount).toBeLessThan(5);
    });
  });

  describe("getCircuitBreakerStats", () => {
    it("should return initial stats when no operations have been run", () => {
      const stats = getCircuitBreakerStats();

      expect(stats).toEqual({
        isOpen: false,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: 0,
      });
    });

    it("should return updated stats after operations", async () => {
      const mockFn = vi.fn().mockResolvedValue("result");

      await withCircuitBreaker("test-operation", mockFn);

      const stats = getCircuitBreakerStats();
      expect(stats.successCount).toBeGreaterThan(0);
    });
  });

  describe("resetCircuitBreaker", () => {
    it("should reset all circuit breaker state", async () => {
      const error = new Error("Service unavailable") as Error & { status?: number };
      error.status = 503;

      const mockFn = vi.fn().mockRejectedValue(error);

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker("test-operation", mockFn);
        } catch {
          // Expected to fail
        }
      }

      let stats = getCircuitBreakerStats();
      expect(stats.isOpen).toBe(true);

      // Reset
      resetCircuitBreaker();

      stats = getCircuitBreakerStats();
      expect(stats).toEqual({
        isOpen: false,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: 0,
      });
    });
  });

  describe("retryable status codes", () => {
    const RETRYABLE_STATUS = [429, 500, 502, 503, 504];

    it("should count 429 as circuit breaker failure", async () => {
      const error = new Error("Too many requests") as Error & { status?: number };
      error.status = 429;
      const mockFn = vi.fn().mockRejectedValue(error);

      try {
        await withCircuitBreaker("test", mockFn);
      } catch {
        // Expected
      }

      const stats = getCircuitBreakerStats();
      expect(stats.failureCount).toBe(1);
    });

    it("should count 500 as circuit breaker failure", async () => {
      const error = new Error("Internal server error") as Error & { status?: number };
      error.status = 500;
      const mockFn = vi.fn().mockRejectedValue(error);

      try {
        await withCircuitBreaker("test", mockFn);
      } catch {
        // Expected
      }

      const stats = getCircuitBreakerStats();
      expect(stats.failureCount).toBe(1);
    });

    it("should count 502 as circuit breaker failure", async () => {
      const error = new Error("Bad gateway") as Error & { status?: number };
      error.status = 502;
      const mockFn = vi.fn().mockRejectedValue(error);

      try {
        await withCircuitBreaker("test", mockFn);
      } catch {
        // Expected
      }

      const stats = getCircuitBreakerStats();
      expect(stats.failureCount).toBe(1);
    });

    it("should count 503 as circuit breaker failure", async () => {
      const error = new Error("Service unavailable") as Error & { status?: number };
      error.status = 503;
      const mockFn = vi.fn().mockRejectedValue(error);

      try {
        await withCircuitBreaker("test", mockFn);
      } catch {
        // Expected
      }

      const stats = getCircuitBreakerStats();
      expect(stats.failureCount).toBe(1);
    });

    it("should count 504 as circuit breaker failure", async () => {
      const error = new Error("Gateway timeout") as Error & { status?: number };
      error.status = 504;
      const mockFn = vi.fn().mockRejectedValue(error);

      try {
        await withCircuitBreaker("test", mockFn);
      } catch {
        // Expected
      }

      const stats = getCircuitBreakerStats();
      expect(stats.failureCount).toBe(1);
    });
  });
});
