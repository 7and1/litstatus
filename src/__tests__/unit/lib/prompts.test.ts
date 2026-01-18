import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT,
  isValidGenerateResponse,
  type GenerateResponse,
} from "@/lib/prompts";

describe("prompts.ts", () => {
  describe("SYSTEM_PROMPT", () => {
    it("should be a non-empty string", () => {
      expect(typeof SYSTEM_PROMPT).toBe("string");
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
    });

    it("should contain key instructions", () => {
      expect(SYSTEM_PROMPT).toContain("caption");
      expect(SYSTEM_PROMPT).toContain("hashtags");
      expect(SYSTEM_PROMPT).toContain("Language Rule");
      expect(SYSTEM_PROMPT).toContain("JSON");
    });

    it("should mention all modes", () => {
      expect(SYSTEM_PROMPT).toContain("Standard");
      expect(SYSTEM_PROMPT).toContain("Savage");
      expect(SYSTEM_PROMPT).toContain("Rizz");
    });
  });

  describe("isValidGenerateResponse", () => {
    it("should accept valid response with all fields", () => {
      const valid: GenerateResponse = {
        caption: "Test caption",
        hashtags: "#tag1 #tag2",
        detected_object: "camera",
        affiliate_category: "Camera lens",
      };

      expect(isValidGenerateResponse(valid)).toBe(true);
    });

    it("should accept valid response with null optional fields", () => {
      const valid: GenerateResponse = {
        caption: "Test caption",
        hashtags: "#tag1 #tag2",
        detected_object: null,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(valid)).toBe(true);
    });

    it("should reject non-object values", () => {
      expect(isValidGenerateResponse(null)).toBe(false);
      expect(isValidGenerateResponse(undefined)).toBe(false);
      expect(isValidGenerateResponse("string")).toBe(false);
      expect(isValidGenerateResponse(123)).toBe(false);
      expect(isValidGenerateResponse([])).toBe(false);
    });

    it("should reject missing caption", () => {
      const invalid = {
        hashtags: "#tag1",
        detected_object: null,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(invalid)).toBe(false);
    });

    it("should reject non-string caption", () => {
      const invalid = {
        caption: 123,
        hashtags: "#tag1",
        detected_object: null,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(invalid)).toBe(false);
    });

    it("should reject missing hashtags", () => {
      const invalid = {
        caption: "Test",
        detected_object: null,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(invalid)).toBe(false);
    });

    it("should reject non-string hashtags", () => {
      const invalid = {
        caption: "Test",
        hashtags: null,
        detected_object: null,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(invalid)).toBe(false);
    });

    it("should accept valid detected_object", () => {
      const valid = {
        caption: "Test",
        hashtags: "#tag",
        detected_object: "iPhone 15 Pro",
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(valid)).toBe(true);
    });

    it("should accept null detected_object", () => {
      const valid = {
        caption: "Test",
        hashtags: "#tag",
        detected_object: null,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(valid)).toBe(true);
    });

    it("should reject non-string and non-null detected_object", () => {
      const invalid = {
        caption: "Test",
        hashtags: "#tag",
        detected_object: 123,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(invalid)).toBe(false);
    });

    it("should accept valid affiliate_category", () => {
      const valid = {
        caption: "Test",
        hashtags: "#tag",
        detected_object: null,
        affiliate_category: "Camera Accessories",
      };

      expect(isValidGenerateResponse(valid)).toBe(true);
    });

    it("should accept null affiliate_category", () => {
      const valid = {
        caption: "Test",
        hashtags: "#tag",
        detected_object: null,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(valid)).toBe(true);
    });

    it("should reject non-string and non-null affiliate_category", () => {
      const invalid = {
        caption: "Test",
        hashtags: "#tag",
        detected_object: null,
        affiliate_category: 123,
      };

      expect(isValidGenerateResponse(invalid)).toBe(false);
    });

    it("should accept additional properties", () => {
      const valid = {
        caption: "Test",
        hashtags: "#tag",
        detected_object: null,
        affiliate_category: null,
        extra: "some extra property",
      };

      expect(isValidGenerateResponse(valid)).toBe(true);
    });

    it("should handle empty strings correctly", () => {
      const valid = {
        caption: "",
        hashtags: "",
        detected_object: null,
        affiliate_category: null,
      };

      expect(isValidGenerateResponse(valid)).toBe(true);
    });
  });
});
