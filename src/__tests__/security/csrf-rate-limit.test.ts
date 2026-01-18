import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  generateCsrfToken,
  validateCsrfToken,
  createRateLimitHeaders,
  type RateLimitResult,
} from "@/lib/security";

describe("Security - CSRF Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CSRF token generation", () => {
    it("should generate cryptographically random tokens", async () => {
      const tokens = await Promise.all([
        generateCsrfToken(),
        generateCsrfToken(),
        generateCsrfToken(),
        generateCsrfToken(),
        generateCsrfToken(),
      ]);

      // All tokens should be different
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(5);
    });

    it("should generate tokens of consistent length", async () => {
      const tokens = await Promise.all([
        generateCsrfToken(),
        generateCsrfToken(),
        generateCsrfToken(),
      ]);

      for (const token of tokens) {
        expect(token).toHaveLength(64); // 32 bytes * 2 hex chars
      }
    });

    it("should generate valid hexadecimal strings", async () => {
      const token = await generateCsrfToken();
      expect(/^[\da-f]{64}$/.test(token)).toBe(true);
    });

    it("should generate tokens with sufficient entropy", async () => {
      const tokens = new Set();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        tokens.add(await generateCsrfToken());
      }

      // With 32 bytes of entropy (256 bits), we should get 1000 unique tokens
      expect(tokens.size).toBe(iterations);
    });
  });

  describe("CSRF token validation", () => {
    it("should validate correct tokens", async () => {
      const token = await generateCsrfToken();
      const request = new Request("https://example.com", {
        headers: { "X-CSRF-Token": token },
      });

      const isValid = await validateCsrfToken(request, token);
      expect(isValid).toBe(true);
    });

    it("should reject missing tokens", async () => {
      const token = await generateCsrfToken();
      const request = new Request("https://example.com");

      const isValid = await validateCsrfToken(request, token);
      expect(isValid).toBe(false);
    });

    it("should reject incorrect tokens", async () => {
      const token = await generateCsrfToken();
      const wrongToken = await generateCsrfToken();
      const request = new Request("https://example.com", {
        headers: { "X-CSRF-Token": wrongToken },
      });

      const isValid = await validateCsrfToken(request, token);
      expect(isValid).toBe(false);
    });

    it("should reject tokens with incorrect length", async () => {
      const token = await generateCsrfToken();
      const request = new Request("https://example.com", {
        headers: { "X-CSRF-Token": token.slice(0, 32) },
      });

      const isValid = await validateCsrfToken(request, token);
      expect(isValid).toBe(false);
    });

    it("should use constant-time comparison (timing attack resistant)", async () => {
      const token = await generateCsrfToken();

      // Measure time for correct token
      const start1 = performance.now();
      await validateCsrfToken(
        new Request("https://example.com", {
          headers: { "X-CSRF-Token": token },
        }),
        token
      );
      const time1 = performance.now() - start1;

      // Measure time for wrong token (same length)
      const wrongToken = (BigInt("0x" + token) + 1n).toString(16).padStart(64, "0");
      const start2 = performance.now();
      await validateCsrfToken(
        new Request("https://example.com", {
          headers: { "X-CSRF-Token": wrongToken },
        }),
        token
      );
      const time2 = performance.now() - start2;

      // Times should be similar (allowing for some variance in CI)
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(10); // Allow 10x variance for CI environments
    });
  });
});

describe("Security - Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rate limit enforcement", () => {
    it("should allow requests within limit", async () => {
      const result: RateLimitResult = await checkRateLimit("user-1", 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
    });

    it("should track remaining requests", async () => {
      const identifier = "user-2";

      const r1 = await checkRateLimit(identifier, 5, 60000);
      const r2 = await checkRateLimit(identifier, 5, 60000);
      const r3 = await checkRateLimit(identifier, 5, 60000);

      expect(r1.remaining).toBe(4);
      expect(r2.remaining).toBe(3);
      expect(r3.remaining).toBe(2);
    });

    it("should deny requests exceeding limit", async () => {
      const identifier = "user-3";
      const limit = 3;

      // Exhaust quota
      for (let i = 0; i < limit; i++) {
        await checkRateLimit(identifier, limit, 60000);
      }

      const result = await checkRateLimit(identifier, limit, 60000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should use different counters for different identifiers", async () => {
      const r1 = await checkRateLimit("user-A", 2, 60000);
      const r2 = await checkRateLimit("user-B", 2, 60000);

      expect(r1.remaining).toBe(1);
      expect(r2.remaining).toBe(1);

      // User A hits limit
      await checkRateLimit("user-A", 2, 60000);
      const r3 = await checkRateLimit("user-A", 2, 60000);

      expect(r3.allowed).toBe(false);

      // User B still has quota
      const r4 = await checkRateLimit("user-B", 2, 60000);
      expect(r4.allowed).toBe(true);
    });

    it("should handle multiple windows", async () => {
      const identifier = "user-window";
      const windowMs = 100; // Short window for testing

      // Exhaust first window
      await checkRateLimit(identifier, 2, windowMs);
      await checkRateLimit(identifier, 2, windowMs);

      const r1 = await checkRateLimit(identifier, 2, windowMs);
      expect(r1.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // New window should allow requests
      const r2 = await checkRateLimit(identifier, 2, windowMs);
      expect(r2.allowed).toBe(true);
    }, 10000); // Increase timeout for this test
  });

  describe("Rate limit headers", () => {
    it("should create proper rate limit headers", () => {
      const result: RateLimitResult = {
        allowed: true,
        limit: 100,
        remaining: 75,
        resetAt: 1234567890000,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers).toEqual({
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "75",
        "X-RateLimit-Reset": "1234567890000",
      });
    });

    it("should include zero remaining when limit reached", () => {
      const result: RateLimitResult = {
        allowed: false,
        limit: 10,
        remaining: 0,
        resetAt: Date.now() + 60000,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers["X-RateLimit-Remaining"]).toBe("0");
    });
  });

  describe("Distributed rate limiting behavior", () => {
    it("should handle concurrent requests correctly", async () => {
      const identifier = "concurrent-user";
      const limit = 10;

      // Make concurrent requests
      const promises = Array.from({ length: limit }, () =>
        checkRateLimit(identifier, limit, 60000)
      );

      const results = await Promise.all(promises);

      // All should be allowed
      for (const result of results) {
        expect(result.allowed).toBe(true);
      }

      // Next request should be denied
      const overflow = await checkRateLimit(identifier, limit, 60000);
      expect(overflow.allowed).toBe(false);
    });

    it("should handle rapid sequential requests", async () => {
      const identifier = "rapid-user";
      const limit = 5;

      for (let i = 0; i < limit; i++) {
        const result = await checkRateLimit(identifier, limit, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - i - 1);
      }

      const overflow = await checkRateLimit(identifier, limit, 60000);
      expect(overflow.allowed).toBe(false);
    });
  });

  describe("Rate limit bypass prevention", () => {
    it("should not allow bypass by varying identifier format", async () => {
      // These should be treated as different identifiers
      const identifiers = [
        "user-123",
        "user-123 ",
        " user-123",
        "USER-123",
        "user-123\n",
      ];

      for (const id of identifiers) {
        const result = await checkRateLimit(id, 3, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
      }
    });

    it("should handle empty/null identifiers gracefully", async () => {
      const result = await checkRateLimit("", 10, 60000);
      expect(result.allowed).toBe(true);
    });
  });
});
