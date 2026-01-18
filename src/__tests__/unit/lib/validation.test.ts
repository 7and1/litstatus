import { describe, it, expect, beforeEach } from "vitest";
import {
  validateRequest,
  withValidation,
  COMMON_VALIDATION_RULES,
  type ValidationResult,
  type ValidationRule,
} from "@/lib/validation";
import { NextResponse } from "next/server";

describe("validation.ts", () => {
  describe("validateRequest", () => {
    it("should pass valid request", async () => {
      const body = {
        email: "test@example.com",
        rating: "1",
      };
      const rules: ValidationRule[] = [
        { field: "email", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 255 },
        { field: "rating", required: true, enum: ["1", "-1"] },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should fail missing required field", async () => {
      const body = { rating: "1" };
      const rules: ValidationRule[] = [
        { field: "email", required: true },
        { field: "rating", required: true },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("email");
      expect(result.status).toBe(400);
    });

    it("should pass when optional field is missing", async () => {
      const body = { email: "test@example.com" };
      const rules: ValidationRule[] = [
        { field: "email", required: true },
        { field: "name", required: false },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(true);
    });

    it("should fail on minLength violation", async () => {
      const body = { username: "ab" };
      const rules: ValidationRule[] = [
        { field: "username", required: true, minLength: 3 },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("too short");
    });

    it("should fail on maxLength violation", async () => {
      const body = { username: "a".repeat(101) };
      const rules: ValidationRule[] = [
        { field: "username", required: true, maxLength: 100 },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("too long");
    });

    it("should fail on pattern violation", async () => {
      const body = { email: "not-an-email" };
      const rules: ValidationRule[] = [
        { field: "email", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("format");
    });

    it("should fail on enum violation", async () => {
      const body = { rating: "5" };
      const rules: ValidationRule[] = [
        { field: "rating", required: true, enum: ["1", "-1"] },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("value");
    });

    it("should fail on custom validation", async () => {
      const body = { age: "15" };
      const rules: ValidationRule[] = [
        {
          field: "age",
          required: true,
          validate: (v) => Number(v) >= 18,
        },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("validation failed");
    });

    it("should handle empty string as missing for required fields", async () => {
      const body = { email: "" };
      const rules: ValidationRule[] = [
        { field: "email", required: true },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(false);
    });

    it("should handle null values", async () => {
      const body = { email: null };
      const rules: ValidationRule[] = [
        { field: "email", required: true },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(false);
    });

    it("should convert numbers to strings for length checks", async () => {
      const body = { count: 123 };
      const rules: ValidationRule[] = [
        { field: "count", required: true, minLength: 2, maxLength: 5 },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(true);
    });

    it("should accept boolean values", async () => {
      const body = { active: true };
      const rules: ValidationRule[] = [
        { field: "active", required: true },
      ];

      const result = await validateRequest(body, rules);

      expect(result.valid).toBe(true);
    });

    it("should use custom translator", async () => {
      const body = {};
      const rules: ValidationRule[] = [
        { field: "email", required: true },
      ];

      const t = (en: string, zh: string) => (s: string) => `[ZH] ${s}`;

      const result = await validateRequest(body, rules, t);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("[ZH]");
    });
  });

  describe("COMMON_VALIDATION_RULES", () => {
    it("should have email rule", () => {
      expect(COMMON_VALIDATION_RULES.email).toEqual({
        field: "email",
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 255,
      });
    });

    it("should have rating rule", () => {
      expect(COMMON_VALIDATION_RULES.rating).toEqual({
        field: "rating",
        required: true,
        enum: ["1", "-1"],
      });
    });

    it("should have mode rule", () => {
      expect(COMMON_VALIDATION_RULES.mode).toEqual({
        field: "mode",
        required: false,
        enum: ["Standard", "Creative", "Professional"],
      });
    });

    it("should have lang rule", () => {
      expect(COMMON_VALIDATION_RULES.lang).toEqual({
        field: "lang",
        required: false,
        enum: ["en", "zh"],
      });
    });
  });

  describe("withValidation", () => {
    it("should call handler when validation passes", async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const rules: ValidationRule[] = [
        { field: "email", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      ];

      const middleware = withValidation(rules, mockHandler);
      const request = new Request("https://example.com", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      });

      const response = await middleware(request);

      expect(mockHandler).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(response.status).toBe(200);
    });

    it("should return error response when validation fails", async () => {
      const mockHandler = vi.fn();

      const rules: ValidationRule[] = [
        { field: "email", required: true },
      ];

      const middleware = withValidation(rules, mockHandler);
      const request = new Request("https://example.com", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await middleware(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
    });

    it("should handle invalid JSON", async () => {
      const mockHandler = vi.fn();

      const rules: ValidationRule[] = [
        { field: "email", required: true },
      ];

      const middleware = withValidation(rules, mockHandler);
      const request = new Request("https://example.com", {
        method: "POST",
        body: "invalid json",
      });

      const response = await middleware(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
    });

    it("should include security headers in error response", async () => {
      const mockHandler = vi.fn();

      const rules: ValidationRule[] = [
        { field: "email", required: true },
      ];

      const middleware = withValidation(rules, mockHandler);
      const request = new Request("https://example.com", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await middleware(request);
      const headers = response.headers;

      expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headers.get("X-Frame-Options")).toBe("DENY");
    });
  });
});
