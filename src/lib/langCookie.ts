import type { Lang } from "@/lib/i18n";

const LANG_COOKIE_NAME = "litstatus_lang";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Set language cookie with proper attributes for persistence
 */
export function setLangCookie(lang: Lang): void {
  if (typeof document === "undefined") return;

  const maxAge = COOKIE_MAX_AGE;
  const sameSite = "Lax";
  const secure = window.location.protocol === "https:";
  const domain = window.location.hostname;

  // Set cookie with proper attributes for cross-page persistence
  document.cookie = `${LANG_COOKIE_NAME}=${lang}; path=/; max-age=${maxAge}; SameSite=${sameSite}${secure ? "; Secure" : ""}`;
}

/**
 * Get language from cookie
 */
export function getLangCookie(): Lang | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(^| )${LANG_COOKIE_NAME}=([^;]+)`));
  return match ? (match[2] as Lang) : null;
}

/**
 * Remove language cookie
 */
export function removeLangCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${LANG_COOKIE_NAME}=; path=/; max-age=0`;
}

/**
 * Get language from cookie with fallback to localStorage and detection
 * This ensures we maintain the user's language preference across sessions
 */
export function getStoredLang(): Lang {
  // 1. Try cookie first (most reliable for server-side)
  const cookieLang = getLangCookie();
  if (cookieLang === "en" || cookieLang === "zh") {
    return cookieLang;
  }

  // 2. Try localStorage
  try {
    const stored = localStorage.getItem("litstatus_lang");
    if (stored === "en" || stored === "zh") {
      // Sync to cookie for future requests
      setLangCookie(stored);
      return stored;
    }
  } catch {
    // localStorage may be disabled
  }

  // 3. Detect from browser
  const browserLang = navigator.language.toLowerCase();
  const detected = browserLang.startsWith("zh") ? "zh" : "en";

  // Save the detected preference
  setLangCookie(detected);
  try {
    localStorage.setItem("litstatus_lang", detected);
  } catch {
    // localStorage may be disabled
  }

  return detected;
}

/**
 * Save language to both cookie and localStorage for maximum persistence
 */
export function saveLangPref(lang: Lang): void {
  setLangCookie(lang);
  try {
    localStorage.setItem("litstatus_lang", lang);
  } catch {
    // localStorage may be disabled
  }
}
