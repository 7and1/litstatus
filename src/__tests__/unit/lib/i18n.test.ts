import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  type Lang,
  LANG_STORAGE_KEY,
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  LANG_NAMES,
  getLangTag,
  getLangDir,
  normalizeLang,
  isSupportedLang,
  detectLangFromHeader,
  getClientLang,
  saveLang,
  stripLangPrefix,
  localizePath,
  getAlternatePaths,
  getHreflangUrl,
  generateHreflangTags,
  getOppositeLang,
  isLangPath,
  validateLang,
  getLangPreference,
} from "@/lib/i18n";

describe("i18n.ts", () => {
  describe("constants", () => {
    it("should have correct default language", () => {
      expect(DEFAULT_LANG).toBe("en");
    });

    it("should support English and Chinese", () => {
      expect(SUPPORTED_LANGS).toEqual(["en", "zh"]);
    });

    it("should have correct language names", () => {
      expect(LANG_NAMES.en.en).toBe("English");
      expect(LANG_NAMES.en.zh).toBe("中文");
      expect(LANG_NAMES.zh.en).toBe("English");
      expect(LANG_NAMES.zh.zh).toBe("中文");
    });
  });

  describe("getLangTag", () => {
    it("should return en for English", () => {
      expect(getLangTag("en")).toBe("en");
    });

    it("should return zh-CN for Chinese", () => {
      expect(getLangTag("zh")).toBe("zh-CN");
    });
  });

  describe("getLangDir", () => {
    it("should return ltr for both languages", () => {
      expect(getLangDir()).toBe("ltr");
    });
  });

  describe("normalizeLang", () => {
    it("should return en for undefined/null/empty", () => {
      expect(normalizeLang()).toBe("en");
      expect(normalizeLang(null)).toBe("en");
      expect(normalizeLang("")).toBe("en");
    });

    it("should normalize language codes", () => {
      expect(normalizeLang("en")).toBe("en");
      expect(normalizeLang("EN")).toBe("en");
      expect(normalizeLang("zh")).toBe("zh");
      expect(normalizeLang("ZH")).toBe("zh");
      expect(normalizeLang("zh-CN")).toBe("zh");
      expect(normalizeLang("zh-TW")).toBe("zh");
    });

    it("should default to en for unsupported languages", () => {
      expect(normalizeLang("fr")).toBe("en");
      expect(normalizeLang("de")).toBe("en");
      expect(normalizeLang("es")).toBe("en");
    });
  });

  describe("isSupportedLang", () => {
    it("should return true for supported languages", () => {
      expect(isSupportedLang("en")).toBe(true);
      expect(isSupportedLang("zh")).toBe(true);
    });

    it("should return false for unsupported languages", () => {
      expect(isSupportedLang("fr")).toBe(false);
      expect(isSupportedLang("de")).toBe(false);
      expect(isSupportedLang("")).toBe(false);
    });
  });

  describe("detectLangFromHeader", () => {
    it("should detect English from Accept-Language header", () => {
      expect(detectLangFromHeader("en-US,en;q=0.9")).toBe("en");
      expect(detectLangFromHeader("en-GB")).toBe("en");
    });

    it("should detect Chinese from Accept-Language header", () => {
      expect(detectLangFromHeader("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh");
      expect(detectLangFromHeader("zh-TW,zh;q=0.9")).toBe("zh");
    });

    it("should respect quality values", () => {
      expect(detectLangFromHeader("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh");
      expect(detectLangFromHeader("en;q=0.9,zh-CN;q=0.8")).toBe("en");
    });

    it("should default to en for empty/undefined header", () => {
      expect(detectLangFromHeader()).toBe("en");
      expect(detectLangFromHeader("")).toBe("en");
      expect(detectLangFromHeader(null as unknown as string)).toBe("en");
    });

    it("should prioritize supported languages", () => {
      expect(detectLangFromHeader("fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7")).toBe("en");
      expect(detectLangFromHeader("ja-JP,ja;q=0.9,zh-CN;q=0.8")).toBe("zh");
    });
  });

  describe("getClientLang", () => {
    it("should return default lang when window is undefined (server-side)", () => {
      expect(getClientLang()).toBe("en");
    });
  });

  describe("saveLang", () => {
    it("should handle server-side (no-op)", () => {
      expect(() => saveLang("en")).not.toThrow();
      expect(() => saveLang("zh")).not.toThrow();
    });
  });

  describe("stripLangPrefix", () => {
    it("should strip zh prefix", () => {
      expect(stripLangPrefix("/zh/use-cases")).toEqual({
        lang: "zh",
        path: "/use-cases",
      });
      expect(stripLangPrefix("/zh")).toEqual({
        lang: "zh",
        path: "/",
      });
    });

    it("should not strip en prefix (no prefix for en)", () => {
      expect(stripLangPrefix("/use-cases")).toEqual({
        lang: "en",
        path: "/use-cases",
      });
      expect(stripLangPrefix("/")).toEqual({
        lang: "en",
        path: "/",
      });
    });

    it("should handle paths without leading slash", () => {
      expect(stripLangPrefix("zh/use-cases")).toEqual({
        lang: "zh",
        path: "/use-cases",
      });
      expect(stripLangPrefix("use-cases")).toEqual({
        lang: "en",
        path: "/use-cases",
      });
    });

    it("should handle nested paths with zh", () => {
      expect(stripLangPrefix("/zh/case-studies/example")).toEqual({
        lang: "zh",
        path: "/case-studies/example",
      });
    });
  });

  describe("localizePath", () => {
    it("should add zh prefix", () => {
      expect(localizePath("/use-cases", "zh")).toBe("/zh/use-cases");
      expect(localizePath("/", "zh")).toBe("/zh");
    });

    it("should not add prefix for en", () => {
      expect(localizePath("/use-cases", "en")).toBe("/use-cases");
      expect(localizePath("/", "en")).toBe("/");
    });

    it("should strip existing prefix before adding new one", () => {
      expect(localizePath("/zh/use-cases", "en")).toBe("/use-cases");
      expect(localizePath("/use-cases", "zh")).toBe("/zh/use-cases");
    });
  });

  describe("getAlternatePaths", () => {
    const baseUrl = "https://litstatus.com";

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = baseUrl;
    });

    it("should generate alternate paths for root", () => {
      const alternates = getAlternatePaths("/");

      expect(alternates).toEqual({
        en: `${baseUrl}/`,
        "zh-CN": `${baseUrl}/zh`,
        "x-default": `${baseUrl}/`,
      });
    });

    it("should generate alternate paths for nested paths", () => {
      const alternates = getAlternatePaths("/use-cases");

      expect(alternates).toEqual({
        en: `${baseUrl}/use-cases`,
        "zh-CN": `${baseUrl}/zh/use-cases`,
        "x-default": `${baseUrl}/use-cases`,
      });
    });

    it("should handle zh prefix in input", () => {
      const alternates = getAlternatePaths("/zh/pricing");

      expect(alternates).toEqual({
        en: `${baseUrl}/pricing`,
        "zh-CN": `${baseUrl}/zh/pricing`,
        "x-default": `${baseUrl}/pricing`,
      });
    });
  });

  describe("getHreflangUrl", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://litstatus.com";
    });

    it("should generate hreflang URL for en", () => {
      expect(getHreflangUrl("/pricing", "en")).toBe("https://litstatus.com/pricing");
    });

    it("should generate hreflang URL for zh", () => {
      expect(getHreflangUrl("/pricing", "zh")).toBe("https://litstatus.com/zh/pricing");
    });
  });

  describe("generateHreflangTags", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://litstatus.com";
    });

    it("should generate hreflang tags for root", () => {
      const tags = generateHreflangTags("/");

      expect(tags).toEqual([
        { lang: "en", url: "https://litstatus.com/" },
        { lang: "zh-CN", url: "https://litstatus.com/zh" },
        { lang: "x-default", url: "https://litstatus.com/" },
      ]);
    });

    it("should generate hreflang tags for nested paths", () => {
      const tags = generateHreflangTags("/pricing");

      expect(tags).toEqual([
        { lang: "en", url: "https://litstatus.com/pricing" },
        { lang: "zh-CN", url: "https://litstatus.com/zh/pricing" },
        { lang: "x-default", url: "https://litstatus.com/pricing" },
      ]);
    });

    it("should strip zh prefix from input", () => {
      const tags = generateHreflangTags("/zh/pricing");

      expect(tags).toEqual([
        { lang: "en", url: "https://litstatus.com/pricing" },
        { lang: "zh-CN", url: "https://litstatus.com/zh/pricing" },
        { lang: "x-default", url: "https://litstatus.com/pricing" },
      ]);
    });
  });

  describe("getOppositeLang", () => {
    it("should return zh for en", () => {
      expect(getOppositeLang("en")).toBe("zh");
    });

    it("should return en for zh", () => {
      expect(getOppositeLang("zh")).toBe("en");
    });
  });

  describe("isLangPath", () => {
    it("should detect en paths", () => {
      expect(isLangPath("/", "en")).toBe(true);
      expect(isLangPath("/pricing", "en")).toBe(true);
      expect(isLangPath("/zh/pricing", "en")).toBe(false);
    });

    it("should detect zh paths", () => {
      expect(isLangPath("/zh", "zh")).toBe(true);
      expect(isLangPath("/zh/pricing", "zh")).toBe(true);
      expect(isLangPath("/pricing", "zh")).toBe(false);
    });
  });

  describe("validateLang", () => {
    it("should return valid languages", () => {
      expect(validateLang("en")).toBe("en");
      expect(validateLang("zh")).toBe("zh");
    });

    it("should return default for invalid languages", () => {
      expect(validateLang("fr")).toBe("en");
      expect(validateLang("")).toBe("en");
      expect(validateLang(undefined as unknown as string)).toBe("en");
      expect(validateLang(null as unknown as string)).toBe("en");
    });
  });

  describe("getLangPreference", () => {
    it("should prefer cookie value", () => {
      expect(getLangPreference("zh", "en-US")).toBe("zh");
      expect(getLangPreference("en", "zh-CN")).toBe("en");
    });

    it("should fallback to Accept-Language header", () => {
      expect(getLangPreference(null, "zh-CN")).toBe("zh");
      expect(getLangPreference(null, "en-US")).toBe("en");
    });

    it("should fallback to default when both are missing", () => {
      expect(getLangPreference(null, null)).toBe("en");
      expect(getLangPreference("", "")).toBe("en");
    });

    it("should ignore invalid cookie value", () => {
      expect(getLangPreference("fr", "zh-CN")).toBe("zh");
    });
  });
});
