/**
 * Server-side i18n utilities
 * This file can only be imported in Server Components or Server Actions
 */

import { cookies } from "next/headers";
import type { Lang } from "./i18n";
import {
  LANG_STORAGE_KEY,
  DEFAULT_LANG,
  isSupportedLang,
  detectLangFromHeader,
} from "./i18n";

/**
 * Get language from server-side cookies with Accept-Language fallback
 * This function can only be called in Server Components
 */
export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANG_STORAGE_KEY)?.value;

  if (cookieLang && isSupportedLang(cookieLang)) {
    return cookieLang;
  }

  // No cookie set, detect from headers
  const headersList = await import("next/headers").then((m) => m.headers());
  const acceptLanguage = headersList.get("accept-language");
  const detectedLang = detectLangFromHeader(acceptLanguage);

  return detectedLang;
}

/**
 * Get language from server-side with headers provided
 * Use this when you already have access to headers
 */
export function getLangFromHeaders(cookieLang: string | null, acceptLanguage: string | null | undefined): Lang {
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
