"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { localizePath, stripLangPrefix, getOppositeLang } from "@/lib/i18n";
import { saveLangPref, getStoredLang } from "@/lib/langCookie";

/**
 * Custom hook for language management
 *
 * Provides:
 * - Current language state
 * - Function to change language
 * - URL-aware language detection
 * - Automatic cookie/localStorage persistence
 *
 * @example
 * const { lang, changeLang, toggleLang, isEnglish, isChinese } = useLanguage();
 */
export function useLanguage(initialLang?: Lang) {
  const router = useRouter();
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>(initialLang || "en");

  // Detect language from pathname on mount
  useEffect(() => {
    const { lang: pathLang } = stripLangPrefix(pathname);
    if (pathLang !== lang) {
      setLang(pathLang);
    }
  }, [pathname, lang]);

  // Change language and navigate
  const changeLang = useCallback(
    (newLang: Lang) => {
      if (newLang === lang) return;

      // Save preference
      saveLangPref(newLang);

      // Navigate to localized path
      const newPath = localizePath(pathname, newLang);
      if (newPath !== pathname) {
        router.push(newPath);
      }

      setLang(newLang);
    },
    [lang, pathname, router],
  );

  // Toggle between languages
  const toggleLang = useCallback(() => {
    const nextLang = getOppositeLang(lang);
    changeLang(nextLang);
  }, [lang, changeLang]);

  return {
    lang,
    setLang: setLang,
    changeLang,
    toggleLang,
    isEnglish: lang === "en",
    isChinese: lang === "zh",
  };
}

/**
 * Simpler hook that just provides the current language and toggle function
 */
export function useLanguageToggle(initialLang?: Lang) {
  const { lang, toggleLang, isEnglish, isChinese } = useLanguage(initialLang);

  return {
    lang,
    toggleLang,
    isEnglish,
    isChinese,
  };
}

/**
 * Hook to get language from URL pathname
 */
export function usePathnameLanguage(): Lang {
  const pathname = usePathname();

  // Don't use useState/useEffect here - we want synchronous detection
  const { lang } = stripLangPrefix(pathname);
  return lang;
}

/**
 * Hook to get localized URL for navigation
 */
export function useLocalizedUrls() {
  const pathname = usePathname();
  const { lang } = stripLangPrefix(pathname);

  const getLocalizedUrl = useCallback(
    (path: string, targetLang?: Lang) => {
      return localizePath(path, targetLang || lang);
    },
    [lang],
  );

  const getCurrentUrlForLang = useCallback(
    (targetLang: Lang) => {
      return localizePath(pathname, targetLang);
    },
    [pathname],
  );

  return {
    getLocalizedUrl,
    getCurrentUrlForLang,
    currentLang: lang,
  };
}

/**
 * Hook for server component language detection
 * Note: This should only be used in Server Components
 * Client components should use useLanguage() instead
 */
export function getServerLanguage(headers: Headers): Lang {
  const cookieLang = headers
    .get("cookie")
    ?.match(/litstatus_lang=(en|zh)/)?.[1];
  const acceptLang = headers.get("accept-language") || "";

  if (cookieLang === "en" || cookieLang === "zh") {
    return cookieLang;
  }

  return acceptLang.toLowerCase().startsWith("zh") ? "zh" : "en";
}
