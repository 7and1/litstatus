export type Lang = "en" | "zh";

export const LANG_STORAGE_KEY = "litstatus_lang";

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
  return input === "zh" ? "zh" : "en";
}

export function loadLang(): Lang {
  if (typeof window === "undefined") return "en";
  return normalizeLang(window.localStorage.getItem(LANG_STORAGE_KEY));
}

export function saveLang(lang: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANG_STORAGE_KEY, lang);
}

/**
 * Get hreflang URL for a given path and language
 */
export function getHreflangUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";
  return `${baseUrl}${path}`;
}
