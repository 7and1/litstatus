export type Lang = "en" | "zh";

export const LANG_STORAGE_KEY = "litstatus_lang";
export const DEFAULT_LANG: Lang = "en";
export const SUPPORTED_LANGS: Lang[] = ["en", "zh"];

// Display names for languages in each language
export const LANG_NAMES: Record<Lang, Record<Lang, string>> = {
  en: { en: "English", zh: "中文" },
  zh: { en: "English", zh: "中文" },
};

/**
 * Get BCP 47 language tag for SEO/lang attributes
 */
export function getLangTag(lang: Lang): string {
  return lang === "zh" ? "zh-CN" : "en";
}

/**
 * Get HTML dir attribute value
 */
export function getLangDir(): "ltr" | "rtl" {
  return "ltr"; // Both English and Chinese are LTR
}

export function normalizeLang(input?: string | null): Lang {
  if (!input) return DEFAULT_LANG;
  const normalized = input.toLowerCase().split("-")[0] as Lang;
  return normalized === "zh" ? "zh" : "en";
}

export function isSupportedLang(input?: string | null): input is Lang {
  return input === "en" || input === "zh";
}

/**
 * Detect language from Accept-Language header
 */
export function detectLangFromHeader(acceptLanguage?: string | null): Lang {
  if (!acceptLanguage) return DEFAULT_LANG;

  // Parse Accept-Language header (e.g., "zh-CN,zh;q=0.9,en;q=0.8")
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      const quality = qValue ? parseFloat(qValue) : 1;
      return { code: code.toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported language
  for (const { code } of languages) {
    const baseCode = code.split("-")[0] as Lang;
    if (baseCode === "zh") return "zh";
    if (baseCode === "en") return "en";
  }

  return DEFAULT_LANG;
}

/**
 * Get language from client-side localStorage
 */
export function getClientLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  return normalizeLang(window.localStorage.getItem(LANG_STORAGE_KEY));
}

export function saveLang(lang: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANG_STORAGE_KEY, lang);
}

/**
 * Strip language prefix from pathname
 * @example stripLangPrefix("/zh/use-cases") -> { lang: "zh", path: "/use-cases" }
 * @example stripLangPrefix("/use-cases") -> { lang: "en", path: "/use-cases" }
 */
export function stripLangPrefix(pathname: string): { lang: Lang; path: string } {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized === "/zh" || normalized.startsWith("/zh/")) {
    const path = normalized.replace(/^\/zh/, "") || "/";
    return { lang: "zh", path };
  }
  return { lang: "en", path: normalized };
}

/**
 * Localize a path with the given language
 * @example localizePath("/use-cases", "zh") -> "/zh/use-cases"
 * @example localizePath("/use-cases", "en") -> "/use-cases"
 */
export function localizePath(pathname: string, lang: Lang): string {
  const { path } = stripLangPrefix(pathname);
  if (lang === "zh") {
    return path === "/" ? "/zh" : `/zh${path}`;
  }
  return path;
}

/**
 * Get alternate language paths for hreflang
 */
export function getAlternatePaths(pathname: string) {
  const { path } = stripLangPrefix(pathname);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

  return {
    en: `${baseUrl}${path}`,
    "zh-CN": `${baseUrl}/zh${path === "/" ? "" : path}`,
    "x-default": `${baseUrl}${path}`,
  } as const;
}

/**
 * Get hreflang URL for a given path and language
 */
export function getHreflangUrl(path: string, lang: Lang): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";
  const localized = localizePath(path, lang);
  return `${baseUrl}${localized}`;
}

/**
 * Generate hreflang tags for SEO
 */
export type HreflangEntry = {
  lang: string;
  url: string;
};

export function generateHreflangTags(pathname: string): HreflangEntry[] {
  const { path } = stripLangPrefix(pathname);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

  return [
    { lang: "en", url: `${baseUrl}${path}` },
    { lang: "zh-CN", url: `${baseUrl}/zh${path === "/" ? "" : path}` },
    { lang: "x-default", url: `${baseUrl}${path}` },
  ];
}

/**
 * Get the opposite language
 */
export function getOppositeLang(lang: Lang): Lang {
  return lang === "en" ? "zh" : "en";
}

/**
 * Check if a pathname is for a specific language
 */
export function isLangPath(pathname: string, lang: Lang): boolean {
  const { lang: detectedLang } = stripLangPrefix(pathname);
  return detectedLang === lang;
}

/**
 * Validate language and return a safe default
 */
export function validateLang(input: string | undefined | null): Lang {
  if (isSupportedLang(input)) return input;
  return DEFAULT_LANG;
}

/**
 * Get language preference order for a user
 * Combines cookie, localStorage, and Accept-Language header
 */
export function getLangPreference(
  cookieLang: string | null,
  acceptLanguage: string | null,
): Lang {
  // 1. Check cookie
  if (cookieLang && isSupportedLang(cookieLang)) {
    return cookieLang;
  }

  // 2. Check Accept-Language header
  if (acceptLanguage) {
    const detected = detectLangFromHeader(acceptLanguage);
    return detected;
  }

  // 3. Fall back to default
  return DEFAULT_LANG;
}
