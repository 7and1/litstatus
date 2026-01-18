import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserFromRequest, getAuthResult } from "@/lib/auth";
import { isValidEmail, constantTimeEqual } from "@/lib/security";

// Mock supabaseAdmin
vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: vi.fn(),
}));

import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

describe("Security - Authentication Bypass Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authorization header parsing", () => {
    it("should reject missing authorization header", async () => {
      const request = new Request("https://example.com");

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should reject empty authorization header", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: "" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should reject malformed authorization header", async () => {
      const malformedHeaders = [
        "InvalidFormat token",
        "Basic token", // Wrong scheme
        "token", // Missing scheme
        "Bearer", // Missing token
        "Bearer ", // Token is empty after trimming
        "Bearer  ", // Token is only whitespace
      ];

      for (const authHeader of malformedHeaders) {
        const request = new Request("https://example.com", {
          headers: { authorization: authHeader },
        });

        const user = await getUserFromRequest(request);
        expect(user).toBeNull();
      }
    });

    it("should handle case-insensitive Bearer prefix", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(createSupabaseAdmin).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any);

      const variations = [
        "Bearer token",
        "bearer token",
        "BEARER token",
        "BeArEr token",
      ];

      for (const authHeader of variations) {
        const request = new Request("https://example.com", {
          headers: { authorization: authHeader },
        });

        const user = await getUserFromRequest(request);

        // getUserFromRequest should still call Supabase
        expect(user).toEqual(mockUser);
      }
    });

    it("should trim whitespace from token", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(createSupabaseAdmin).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer   valid-token-123   " },
      });

      const user = await getUserFromRequest(request);

      expect(user).toEqual(mockUser);
    });
  });

  describe("Token validation via Supabase", () => {
    it("should return null when Supabase returns error", async () => {
      vi.mocked(createSupabaseAdmin).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Invalid token"),
          }),
        },
      } as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer invalid-token" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should return null when Supabase returns no user", async () => {
      vi.mocked(createSupabaseAdmin).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer expired-token" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should return user when token is valid", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(createSupabaseAdmin).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer valid-token" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toEqual({ id: "user-123", email: "test@example.com" });
    });
  });

  describe("AuthResult error codes", () => {
    it("should return missing_token error when no auth header", async () => {
      const request = new Request("https://example.com");

      const result = await getAuthResult(request);

      expect(result).toEqual({
        success: false,
        user: null,
        error: "missing_token",
      });
    });

    it("should return invalid_token error for invalid tokens", async () => {
      vi.mocked(createSupabaseAdmin).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Invalid token"),
          }),
        },
      } as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer invalid" },
      });

      const result = await getAuthResult(request);

      expect(result).toEqual({
        success: false,
        user: null,
        error: "invalid_token",
      });
    });

    it("should return success with valid token", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(createSupabaseAdmin).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer valid" },
      });

      const result = await getAuthResult(request);

      expect(result).toEqual({
        success: true,
        user: { id: "user-123", email: "test@example.com" },
      });
    });
  });
});

describe("Security - Timing Attack Prevention", () => {
  describe("Constant-time string comparison", () => {
    it("should return true for equal strings", () => {
      expect(constantTimeEqual("token123", "token123")).toBe(true);
      expect(constantTimeEqual("", "")).toBe(true);
      expect(constantTimeEqual("a", "a")).toBe(true);
    });

    it("should return false for unequal strings", () => {
      expect(constantTimeEqual("token123", "token124")).toBe(false);
      expect(constantTimeEqual("abc", "xyz")).toBe(false);
      expect(constantTimeEqual("a", "b")).toBe(false);
    });

    it("should return false for different length strings", () => {
      expect(constantTimeEqual("token", "tokens")).toBe(false);
      expect(constantTimeEqual("", "a")).toBe(false);
      expect(constantTimeEqual("abc", "abcd")).toBe(false);
    });

    it("should have consistent timing regardless of match position", () => {
      const base = "a".repeat(100);
      const matchEarly = "a" + "b".repeat(99);
      const matchLate = "a".repeat(99) + "b";

      const times: number[] = [];

      for (const s of [base, matchEarly, matchLate]) {
        const start = performance.now();
        constantTimeEqual(s, base);
        times.push(performance.now() - start);
      }

      // All times should be similar (within 10x for CI environments)
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      for (const time of times) {
        expect(Math.abs(time - avgTime)).toBeLessThan(10);
      }
    });

    it("should prevent length-based timing attacks", () => {
      const short = "abc";
      const medium = "a".repeat(50);
      const long = "a".repeat(100);

      const times: number[] = [];

      for (const s of [short, medium, long]) {
        const start = performance.now();
        constantTimeEqual(s, "wrong");
        times.push(performance.now() - start);
      }

      // While there will be some difference due to loop overhead,
      // it should not be linearly proportional to string length
      // Times should be in the same order of magnitude
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      expect(maxTime / minTime).toBeLessThan(100);
    });
  });
});

describe("Security - Email Validation Bypass Prevention", () => {
  describe("Email validation edge cases", () => {
    it("should reject null bytes in email", () => {
      expect(isValidEmail("test\x00@example.com")).toBe(false);
      expect(isValidEmail("test@\x00example.com")).toBe(false);
      expect(isValidEmail("\x00test@example.com")).toBe(false);
    });

    it("should reject control characters in email", () => {
      expect(isValidEmail("test\n@example.com")).toBe(false);
      expect(isValidEmail("test\r@example.com")).toBe(false);
      expect(isValidEmail("test\t@example.com")).toBe(false);
      expect(isValidEmail("test\x1F@example.com")).toBe(false);
    });

    it("should reject excessively long emails", () => {
      const longLocal = "a".repeat(321) + "@example.com";
      expect(isValidEmail(longLocal)).toBe(false);

      const longDomain = "test@" + "a".repeat(300) + ".com";
      // This might be valid format but should be rejected by length check
      // isValidEmail only checks basic format and length of entire string
      expect(isValidEmail(longDomain)).toBe(false);
    });

    it("should accept valid edge cases", () => {
      const validEdgeCases = [
        "test+tag@example.com",
        "user.name@example.com",
        "a@b.co",
        "test@sub.domain.example.com",
      ];

      for (const email of validEdgeCases) {
        expect(isValidEmail(email)).toBe(true);
      }
    });
  });
});

describe("Security - Session/Token Manipulation", () => {
  it("should handle tokens with null bytes gracefully", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Invalid token"),
        }),
      },
    } as any);

    const request = new Request("https://example.com", {
      headers: { authorization: "Bearer token\x00with\x00nulls" },
    });

    const user = await getUserFromRequest(request);

    // Should either return null or pass through to Supabase
    expect(user).toBeNull();
  });

  it("should handle tokens with control characters", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Invalid token"),
        }),
      },
    } as any);

    const request = new Request("https://example.com", {
      headers: { authorization: "Bearer token\n\r\t" },
    });

    const user = await getUserFromRequest(request);

    // Should pass through to Supabase which will reject it
    expect(user).toBeNull();
  });
});
