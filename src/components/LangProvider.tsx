"use client";

import { createContext, useContext, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { saveLangPref } from "@/lib/langCookie";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({
  value,
  children,
}: {
  value: LangContextValue;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Enhanced setLang that saves preference and navigates
  const setLang = useCallback(
    (newLang: Lang) => {
      // Save preference to both cookie and localStorage
      saveLangPref(newLang);

      // Navigate to the localized version of current path
      const newPath = localizePath(pathname, newLang);
      if (newPath !== pathname) {
        router.push(newPath);
      }

      // Call original setLang if provided
      value.setLang(newLang);
    },
    [pathname, router, value],
  );

  return (
    <LangContext.Provider value={{ lang: value.lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used within LangProvider");
  }
  return ctx;
}

export default LangProvider;

