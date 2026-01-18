"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { localizePath, getOppositeLang, LANG_NAMES } from "@/lib/i18n";

type LanguageSwitcherProps = {
  lang: Lang;
  variant?: "button" | "link" | "dropdown";
  showLabel?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Language switcher component with multiple display variants
 *
 * Supports:
 * - "button": Simple toggle button (default)
 * - "link": Clickable link styled as button
 * - "dropdown": Select dropdown (future enhancement)
 */
export default function LanguageSwitcher({
  lang,
  variant = "button",
  showLabel = false,
  className = "",
  "aria-label": ariaLabel,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const oppositeLang = getOppositeLang(lang);
  const oppositeLangName = LANG_NAMES[lang][oppositeLang];
  const currentLangName = LANG_NAMES[lang][lang];

  const handleToggle = useCallback(() => {
    const newPath = localizePath(pathname, oppositeLang);
    router.push(newPath);
  }, [pathname, oppositeLang, router]);

  const defaultAriaLabel = ariaLabel || (lang === "zh" ? "切换语言" : "Toggle language");

  const buttonContent = useMemo(() => {
    if (variant === "link") {
      return (
        <button
          onClick={handleToggle}
          className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-xs ${className}`}
          aria-label={defaultAriaLabel}
          lang={lang === "zh" ? "zh-CN" : "en"}
        >
          <span className="font-semibold text-[#2ceef0]">{oppositeLang === "en" ? "EN" : "中文"}</span>
          <span className="text-zinc-500">/</span>
          <span>{lang === "en" ? "EN" : "中文"}</span>
        </button>
      );
    }

    // Default button variant
    return (
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-xs ${className}`}
        aria-label={defaultAriaLabel}
        lang={lang === "zh" ? "zh-CN" : "en"}
      >
        <span className="sr-only">{defaultAriaLabel}</span>
        {showLabel ? (
          <>
            <span>{currentLangName}</span>
            <span className="text-zinc-500">→</span>
            <span className="font-semibold text-[#2ceef0]">{oppositeLangName}</span>
          </>
        ) : (
          <>
            <span className="font-semibold">{oppositeLang === "en" ? "EN" : "中文"}</span>
            <span className="text-zinc-500">/</span>
            <span>{lang === "en" ? "EN" : "中文"}</span>
          </>
        )}
      </button>
    );
  }, [handleToggle, oppositeLang, lang, currentLangName, oppositeLangName, defaultAriaLabel, showLabel, variant, className]);

  return buttonContent;
}

/**
 * Compact language switcher for mobile or minimal UI
 */
export function CompactLanguageSwitcher({ lang, className = "" }: { lang: Lang; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const oppositeLang = getOppositeLang(lang);

  const handleToggle = () => {
    const newPath = localizePath(pathname, oppositeLang);
    router.push(newPath);
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center justify-center rounded-lg border border-white/10 px-2 py-1 text-[10px] text-zinc-300 transition hover:border-white/30 hover:bg-white/5 ${className}`}
      aria-label={lang === "zh" ? "切换到英文" : "Switch to Chinese"}
    >
      {lang === "en" ? "EN" : "中文"}
    </button>
  );
}

/**
 * Icon-only language switcher
 */
export function IconLanguageSwitcher({ lang, className = "" }: { lang: Lang; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const oppositeLang = getOppositeLang(lang);

  const handleToggle = () => {
    const newPath = localizePath(pathname, oppositeLang);
    router.push(newPath);
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-xs text-zinc-300 transition hover:border-white/30 hover:bg-white/5 ${className}`}
      aria-label={lang === "zh" ? "切换到英文" : "Switch to Chinese"}
      title={lang === "zh" ? "切换到 English" : "Switch to 中文"}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <span className="ml-1">{oppositeLang === "en" ? "EN" : "中"}</span>
    </button>
  );
}

/**
 * Text link language switcher for footer or inline use
 */
export function LinkLanguageSwitcher({
  lang,
  className = "",
}: {
  lang: Lang;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const oppositeLang = getOppositeLang(lang);

  const handleToggle = () => {
    const newPath = localizePath(pathname, oppositeLang);
    router.push(newPath);
  };

  return (
    <button
      onClick={handleToggle}
      className={`text-[11px] text-zinc-500 underline decoration-white/10 underline-offset-4 transition-colors hover:text-white hover:decoration-white/30 sm:text-xs ${className}`}
    >
      {lang === "en" ? "中文版" : "English"}
    </button>
  );
}
