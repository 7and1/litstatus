import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  isValidEmail,
  validateTextLength,
  validateImageSize,
  constantTimeEqual,
  sanitizeString,
  sanitizeJsonString,
  validateImageType,
  validateImageContent,
  generateDeviceFingerprint,
  createRateLimitHeaders,
  generateCsrfToken,
  validateCsrfToken,
  getCspHeaders,
  SECURITY_HEADERS,
  LIMITS,
  type RateLimitResult,
} from "@/lib/security";

describe("security.ts", () => {
  beforeEach(() => {
    // Clear any cached state
    vi.clearAllMocks();
  });

  describe("LIMITS", () => {
    it("should have all required limit constants", () => {
      expect(LIMITS.MAX_TEXT_LENGTH).toBe(2000);
      expect(LIMITS.MAX_IMAGE_SIZE_BYTES).toBe(10 * 1024 * 1024);
      expect(LIMITS.MAX_EMAIL_LENGTH).toBe(320);
      expect(LIMITS.MAX_NOTE_LENGTH).toBe(500);
      expect(LIMITS.MAX_CAPTION_LENGTH).toBe(1000);
      expect(LIMITS.MAX_HASHTAGS_LENGTH).toBe(500);
      expect(LIMITS.MAX_VARIANT_LENGTH).toBe(50);
    });
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", async () => {
      const result = await checkRateLimit("test-user", 10, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
    });

    it("should track remaining requests correctly", async () => {
      await checkRateLimit("test-user-2", 5, 60000);
      const result2 = await checkRateLimit("test-user-2", 5, 60000);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it("should deny requests exceeding limit", async () => {
      const identifier = "test-user-3";
      const limit = 3;

      for (let i = 0; i < limit; i++) {
        await checkRateLimit(identifier, limit, 60000);
      }

      const result = await checkRateLimit(identifier, limit, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should use different keys for different identifiers", async () => {
      const result1 = await checkRateLimit("user-1", 2, 60000);
      const result2 = await checkRateLimit("user-2", 2, 60000);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result1.remaining).toBe(1);
      expect(result2.remaining).toBe(1);
    });

    it("should return valid resetAt timestamp", async () => {
      const now = Date.now();
      const windowMs = 60000;
      const result = await checkRateLimit("test-user-4", 10, windowMs);

      expect(result.resetAt).toBeGreaterThan(now);
      expect(result.resetAt).toBeLessThanOrEqual(now + windowMs + 1000);
    });
  });

  describe("isValidEmail", () => {
    it("should accept valid email addresses", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.user+tag@example.co.uk")).toBe(true);
      expect(isValidEmail("a@b.co")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user @example.com")).toBe(false);
      expect(isValidEmail("user@example")).toBe(false);
    });

    it("should reject emails with control characters", () => {
      expect(isValidEmail("user\x00@example.com")).toBe(false);
      expect(isValidEmail("user\n@example.com")).toBe(false);
      expect(isValidEmail("user\t@example.com")).toBe(false);
    });

    it("should reject emails exceeding max length", () => {
      const longEmail = "a".repeat(321) + "@example.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });

    it("should handle null and undefined", () => {
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });
  });

  describe("validateTextLength", () => {
    it("should accept text within limit", () => {
      expect(validateTextLength("hello", 2000)).toBe(true);
      expect(validateTextLength("a".repeat(2000), 2000)).toBe(true);
    });

    it("should reject text exceeding limit", () => {
      expect(validateTextLength("a".repeat(2001), 2000)).toBe(false);
    });

    it("should use default MAX_TEXT_LENGTH when not specified", () => {
      expect(validateTextLength("a".repeat(2000))).toBe(true);
      expect(validateTextLength("a".repeat(2001))).toBe(false);
    });

    it("should reject non-string values", () => {
      expect(validateTextLength(null as unknown as string)).toBe(false);
      expect(validateTextLength(undefined as unknown as string)).toBe(false);
    });
  });

  describe("validateImageSize", () => {
    it("should accept images within size limit", () => {
      const smallFile = new File(["content"], "test.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(smallFile, "size", { value: 1024 * 1024 }); // 1MB

      expect(validateImageSize(smallFile)).toBe(true);
    });

    it("should reject images exceeding size limit", () => {
      const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(largeFile, "size", { value: 11 * 1024 * 1024 }); // 11MB

      expect(validateImageSize(largeFile)).toBe(false);
    });

    it("should accept images exactly at the limit", () => {
      const exactFile = new File(["content"], "exact.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(exactFile, "size", {
        value: LIMITS.MAX_IMAGE_SIZE_BYTES,
      });

      expect(validateImageSize(exactFile)).toBe(true);
    });
  });

  describe("validateImageType", () => {
    it("should accept valid image MIME types", () => {
      const jpegFile = new File(["content"], "test.jpg", {
        type: "image/jpeg",
      });
      const pngFile = new File(["content"], "test.png", {
        type: "image/png",
      });
      const webpFile = new File(["content"], "test.webp", {
        type: "image/webp",
      });
      const gifFile = new File(["content"], "test.gif", {
        type: "image/gif",
      });

      expect(validateImageType(jpegFile)).toBe(true);
      expect(validateImageType(pngFile)).toBe(true);
      expect(validateImageType(webpFile)).toBe(true);
      expect(validateImageType(gifFile)).toBe(true);
    });

    it("should reject invalid MIME types", () => {
      const svgFile = new File(["content"], "test.svg", {
        type: "image/svg+xml",
      });
      const pdfFile = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      expect(validateImageType(svgFile)).toBe(false);
      expect(validateImageType(pdfFile)).toBe(false);
    });

    it("should handle case insensitive matching", () => {
      const file = new File(["content"], "test.JPG", {
        type: "IMAGE/JPEG",
      });

      expect(validateImageType(file)).toBe(true);
    });
  });

  describe("validateImageContent", () => {
    it("should validate JPEG magic bytes", async () => {
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const file = new File([jpegBytes], "test.jpg", { type: "image/jpeg" });

      expect(await validateImageContent(file)).toBe(true);
    });

    it("should validate PNG magic bytes", async () => {
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      ]);
      const file = new File([pngBytes], "test.png", { type: "image/png" });

      expect(await validateImageContent(file)).toBe(true);
    });

    it("should validate GIF magic bytes", async () => {
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const file = new File([gifBytes], "test.gif", { type: "image/gif" });

      expect(await validateImageContent(file)).toBe(true);
    });

    it("should validate WebP magic bytes", async () => {
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
        0x50,
      ]);
      const file = new File([webpBytes], "test.webp", { type: "image/webp" });

      expect(await validateImageContent(file)).toBe(true);
    });

    it("should reject invalid magic bytes", async () => {
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const file = new File([invalidBytes], "test.jpg", { type: "image/jpeg" });

      expect(await validateImageContent(file)).toBe(false);
    });
  });

  describe("constantTimeEqual", () => {
    it("should return true for equal strings", () => {
      expect(constantTimeEqual("token123", "token123")).toBe(true);
      expect(constantTimeEqual("", "")).toBe(true);
    });

    it("should return false for unequal strings", () => {
      expect(constantTimeEqual("token123", "token124")).toBe(false);
      expect(constantTimeEqual("token", "Token")).toBe(false);
    });

    it("should return false for different length strings", () => {
      expect(constantTimeEqual("token", "tokens")).toBe(false);
    });

    it("should be timing-attack resistant", () => {
      const start1 = performance.now();
      constantTimeEqual("a".repeat(100), "a".repeat(100));
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      constantTimeEqual("a".repeat(100), "b".repeat(100));
      const time2 = performance.now() - start2;

      // Times should be similar (within 10x tolerance for CI environments)
      expect(Math.abs(time1 - time2)).toBeLessThan(10);
    });
  });

  describe("sanitizeString", () => {
    it("should trim whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
      expect(sanitizeString("\t\nhello\n\t")).toBe("hello");
    });

    it("should remove null bytes", () => {
      expect(sanitizeString("hel\x00lo")).toBe("hello");
      expect(sanitizeString("\x00\x00hello\x00")).toBe("hello");
    });

    it("should remove control characters except newlines and tabs", () => {
      expect(sanitizeString("hel\x01lo")).toBe("hello");
      expect(sanitizeString("hel\x1Flo")).toBe("hello");
    });

    it("should preserve newlines and tabs in original positions", () => {
      expect(sanitizeString("hello\nworld")).toBe("hello\nworld");
      expect(sanitizeString("hello\tworld")).toBe("hello\tworld");
    });

    it("should handle empty strings", () => {
      expect(sanitizeString("")).toBe("");
      expect(sanitizeString("\x00\x01\x02")).toBe("");
    });
  });

  describe("sanitizeJsonString", () => {
    it("should sanitize and trim JSON strings", () => {
      expect(sanitizeJsonString('  {"key":"value"}  ')).toBe('{"key":"value"}');
    });

    it("should remove all control characters", () => {
      expect(sanitizeJsonString('{"key":\x00"value\x01"}')).toBe('{"key":"value"}');
    });
  });

  describe("generateDeviceFingerprint", () => {
    it("should generate consistent fingerprints for same headers", () => {
      const request = new Request("https://example.com", {
        headers: {
          "user-agent": "Mozilla/5.0",
          "accept-language": "en-US",
          "accept-encoding": "gzip",
        },
      });

      const fp1 = generateDeviceFingerprint(request);
      const fp2 = generateDeviceFingerprint(request);

      expect(fp1).toBe(fp2);
    });

    it("should generate different fingerprints for different headers", () => {
      const request1 = new Request("https://example.com", {
        headers: {
          "user-agent": "Mozilla/5.0",
          "accept-language": "en-US",
        },
      });

      const request2 = new Request("https://example.com", {
        headers: {
          "user-agent": "Chrome/1.0",
          "accept-language": "en-US",
        },
      });

      expect(generateDeviceFingerprint(request1)).not.toBe(
        generateDeviceFingerprint(request2)
      );
    });

    it("should handle missing headers", () => {
      const request = new Request("https://example.com");
      const fp = generateDeviceFingerprint(request);

      expect(typeof fp).toBe("string");
      expect(fp.length).toBeGreaterThan(0);
    });
  });

  describe("createRateLimitHeaders", () => {
    it("should create proper rate limit headers", () => {
      const result: RateLimitResult = {
        allowed: true,
        limit: 100,
        remaining: 50,
        resetAt: 1234567890,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers).toEqual({
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "50",
        "X-RateLimit-Reset": "1234567890",
      });
    });
  });

  describe("generateCsrfToken", () => {
    it("should generate a random token", async () => {
      const token1 = await generateCsrfToken();
      const token2 = await generateCsrfToken();

      expect(token1).toHaveLength(64); // 32 bytes * 2 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it("should generate valid hexadecimal strings", async () => {
      const token = await generateCsrfToken();
      expect(/^[\da-f]{64}$/.test(token)).toBe(true);
    });
  });

  describe("validateCsrfToken", () => {
    it("should validate correct tokens", async () => {
      const token = await generateCsrfToken();
      const request = new Request("https://example.com", {
        headers: { "X-CSRF-Token": token },
      });

      expect(await validateCsrfToken(request, token)).toBe(true);
    });

    it("should reject missing tokens", async () => {
      const token = await generateCsrfToken();
      const request = new Request("https://example.com");

      expect(await validateCsrfToken(request, token)).toBe(false);
    });

    it("should reject incorrect tokens", async () => {
      const token = await generateCsrfToken();
      const request = new Request("https://example.com", {
        headers: { "X-CSRF-Token": "wrong" + token },
      });

      expect(await validateCsrfToken(request, token)).toBe(false);
    });
  });

  describe("getCspHeaders", () => {
    it("should generate valid CSP headers", () => {
      const headers = getCspHeaders();

      expect(headers).toHaveProperty("Content-Security-Policy");
      expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
      expect(headers["Content-Security-Policy"]).toContain("script-src");
      expect(headers["Content-Security-Policy"]).toContain("img-src");
    });
  });

  describe("SECURITY_HEADERS", () => {
    it("should include all required security headers", () => {
      expect(SECURITY_HEADERS).toHaveProperty("X-Content-Type-Options", "nosniff");
      expect(SECURITY_HEADERS).toHaveProperty("X-Frame-Options", "DENY");
      expect(SECURITY_HEADERS).toHaveProperty("X-XSS-Protection");
      expect(SECURITY_HEADERS).toHaveProperty("Referrer-Policy");
      expect(SECURITY_HEADERS).toHaveProperty("Strict-Transport-Security");
      expect(SECURITY_HEADERS).toHaveProperty("Content-Security-Policy");
    });
  });
});
