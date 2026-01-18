import { describe, it, expect } from "vitest";
import { getClientIp } from "@/lib/ip";

describe("ip.ts", () => {
  describe("getClientIp", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("https://example.com", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      });

      expect(getClientIp(request)).toBe("192.168.1.100");
    });

    it("should use first IP in x-forwarded-for when multiple present", () => {
      const request = new Request("https://example.com", {
        headers: { "x-forwarded-for": "192.168.1.100, 10.0.0.1, 172.16.0.1" },
      });

      expect(getClientIp(request)).toBe("192.168.1.100");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("https://example.com", {
        headers: { "x-real-ip": "10.0.0.50" },
      });

      expect(getClientIp(request)).toBe("10.0.0.50");
    });

    it("should extract IP from cf-connecting-ip header (Cloudflare)", () => {
      const request = new Request("https://example.com", {
        headers: { "cf-connecting-ip": "203.0.113.1" },
      });

      expect(getClientIp(request)).toBe("203.0.113.1");
    });

    it("should prefer x-forwarded-for over x-real-ip", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.100",
          "x-real-ip": "10.0.0.50",
        },
      });

      expect(getClientIp(request)).toBe("192.168.1.100");
    });

    it("should prefer cf-connecting-ip when available", () => {
      const request = new Request("https://example.com", {
        headers: {
          "cf-connecting-ip": "203.0.113.1",
          "x-forwarded-for": "192.168.1.100",
        },
      });

      expect(getClientIp(request)).toBe("203.0.113.1");
    });

    it("should return null when no IP headers present", () => {
      const request = new Request("https://example.com");

      expect(getClientIp(request)).toBeNull();
    });

    it("should trim whitespace from IP addresses", () => {
      const request = new Request("https://example.com", {
        headers: { "x-forwarded-for": "  192.168.1.100  " },
      });

      expect(getClientIp(request)).toBe("192.168.1.100");
    });

    it("should sanitize IP addresses", () => {
      const request = new Request("https://example.com", {
        headers: { "x-forwarded-for": "192.168.1.100\x00" },
      });

      // sanitizeString should remove null bytes
      const result = getClientIp(request);
      expect(result).not.toContain("\x00");
    });
  });
});
