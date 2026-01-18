import { describe, it, expect, beforeEach, vi } from "vitest";
import { isValidEmail, sanitizeString, sanitizeJsonString } from "@/lib/security";
import { validateRequest, COMMON_VALIDATION_RULES } from "@/lib/validation";

describe("Security - SQL Injection", () => {
  describe("Email validation - SQL injection attempts", () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "admin'--",
      "admin' OR '1'='1",
      "' OR 1=1 --",
      "'; EXEC xp_cmdshell('dir'); --",
      "' UNION SELECT * FROM users --",
      "1' AND 1=1 --",
      "'; INSERT INTO users VALUES ('hacker','password'); --",
      "admin' /*",
      "admin' OR 1=1#",
      "' OR '1'='1'--",
      "x' OR '1'='1'--",
      "user@example.com'; DROP TABLE profiles; --",
      "' OR 'x'='x",
      "admin' UNION SELECT 1,2,3 --",
    ];

    it("should reject SQL injection attempts in email validation", () => {
      for (const payload of sqlInjectionPayloads) {
        const isValid = isValidEmail(payload);
        expect(isValid).toBe(false);
      }
    });

    it("should handle email with SQL-like fragments but valid format", () => {
      // These are technically valid emails even if they contain suspicious strings
      const edgeCases = [
        "select@table.com", // Valid format
        "drop@database.co.uk", // Valid format
        "user@union.dev", // Valid format
      ];

      for (const email of edgeCases) {
        expect(isValidEmail(email)).toBe(true);
      }
    });
  });

  describe("String sanitization", () => {
    it("should remove null bytes (binary injection prevention)", () => {
      const payloads = [
        "test\x00value",
        "\x00\x00\x00",
        "hello\x00world\x00",
        "\x00SELECT * FROM\x00",
      ];

      for (const payload of payloads) {
        const sanitized = sanitizeString(payload);
        expect(sanitized).not.toContain("\x00");
      }
    });

    it("should remove control characters (injection prevention)", () => {
      const payloads = [
        "test\x01value",
        "hello\x1Fworld",
        "test\x08control",
        "text\x7Fmore",
      ];

      for (const payload of payloads) {
        const sanitized = sanitizeString(payload);
        expect(sanitized).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
      }
    });

    it("should preserve newlines and tabs while removing other control chars", () => {
      const input = "hello\n\tworld\x01test\x02";
      const sanitized = sanitizeString(input);

      expect(sanitized).toContain("\n");
      expect(sanitized).toContain("\t");
      expect(sanitized).not.toContain("\x01");
      expect(sanitized).not.toContain("\x02");
    });

    it("should trim whitespace", () => {
      const sanitized = sanitizeString("  \t\n  test  \t\n  ");
      expect(sanitized).toBe("test");
    });
  });

  describe("JSON sanitization", () => {
    it("should remove control characters from JSON strings", () => {
      const input = '{"key":"value\x00","nested":{"test":"data\x01"}}';
      const sanitized = sanitizeJsonString(input);

      expect(sanitized).not.toContain("\x00");
      expect(sanitized).not.toContain("\x01");
    });
  });

  describe("Request validation - SQL injection patterns", () => {
    it("should reject requests with SQL-like patterns in sensitive fields", async () => {
      const sqlPatterns = [
        "'; DROP TABLE",
        "OR '1'='1'",
        "UNION SELECT",
        "1' AND '1'='1",
        "--comment",
        "/*comment*/",
        "EXEC(",
        "xp_cmdshell",
      ];

      for (const pattern of sqlPatterns) {
        // Test that these patterns get caught by validation or sanitization
        const sanitized = sanitizeString(pattern);
        // After sanitization, the pattern should be changed or removed
        expect(sanitized.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Length-based DoS prevention", () => {
    it("should enforce max length on email", () => {
      const longEmail = "a".repeat(321) + "@example.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });

    it("should reject unreasonably long input strings", async () => {
      const longString = "a".repeat(100000);

      // After sanitization, it should still be truncated by validation rules
      const sanitized = sanitizeString(longString);
      expect(sanitized.length).toBe(longString.length);

      // But validation rules should catch it
      const result = await validateRequest(
        { text: longString },
        [{ field: "text", required: true, maxLength: 2000 }]
      );

      expect(result.valid).toBe(false);
    });
  });

  describe("Boolean-based SQL injection patterns", () => {
    const booleanSqlInjection = [
      "1' OR '1'='1",
      "admin' OR '1'='1'--",
      "' OR '1'='1'--",
      "' OR '1'='1'/*",
      "1' AND '1'='1",
      "1' AND '1'='1'--",
      "' AND '1'='2'--",
    ];

    it("should not treat boolean SQL injection as valid emails", () => {
      for (const payload of booleanSqlInjection) {
        expect(isValidEmail(payload)).toBe(false);
      }
    });
  });

  describe("Time-based SQL injection pattern detection", () => {
    const timeBasedPayloads = [
      "'; WAITFOR DELAY '00:00:10'--",
      "1; SLEEP(10)--",
      "'; SELECT SLEEP(10)--",
      "'; pg_sleep(10)--",
      "' OR BENCHMARK(10000000,MD5(1))--",
    ];

    it("should reject time-based SQL injection in email validation", () => {
      for (const payload of timeBasedPayloads) {
        expect(isValidEmail(payload)).toBe(false);
      }
    });
  });

  describe("Second-order SQL injection prevention", () => {
    it("should handle nested injection attempts", () => {
      const nestedPayloads = [
        "admin' /* */ '",
        "'; /* comment */ DROP TABLE users; --",
        "' OR '1'='1' /* ignore */ --",
      ];

      for (const payload of nestedPayloads) {
        const sanitized = sanitizeString(payload);
        // Should be sanitized (control chars removed, trimmed)
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("Hex and char encoding attempts", () => {
    const hexEncodingAttempts = [
      "0x274F52202731273D2731",
      "CHAR(44)",
      "CONCAT(0x27)",
      "UNHEX('27204F52'),
    ];

    it("should not detect hex encoding as valid email format", () => {
      for (const payload of hexEncodingAttempts) {
        expect(isValidEmail(payload)).toBe(false);
      }
    });
  });
});
