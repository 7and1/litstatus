"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import type { Localized } from "@/lib/content";
import { LangProvider } from "@/components/LangProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CookieConsent from "@/components/CookieConsent";
import { OnlineStatus } from "@/components/OnlineStatus";

type MarketingShellProps = {
  lang: Lang;
  title: Localized;
  subtitle?: Localized;
  children: React.ReactNode;
  showFooter?: boolean;
};

const NAV = [
  { href: "/", label: { en: "Home", zh: "首页" } },
  { href: "/use-cases", label: { en: "Use Cases", zh: "使用场景" } },
  { href: "/case-studies", label: { en: "Case Studies", zh: "案例研究" } },
  { href: "/examples", label: { en: "Examples", zh: "文案示例" } },
  { href: "/pricing", label: { en: "Plans", zh: "方案定价" } },
  { href: "/faq", label: { en: "FAQ", zh: "常见问题" } },
] as const;

const FOOTER_LINKS = [
  { href: "/use-cases", label: { en: "Use Cases", zh: "使用场景" } },
  { href: "/case-studies", label: { en: "Case Studies", zh: "案例研究" } },
  { href: "/examples", label: { en: "Examples", zh: "示例" } },
  { href: "/pricing", label: { en: "Plans", zh: "方案定价" } },
  { href: "/faq", label: { en: "FAQ", zh: "常见问题" } },
  { href: "/privacy-policy", label: { en: "Privacy", zh: "隐私政策" } },
  { href: "/terms-of-service", label: { en: "Terms", zh: "服务条款" } },
] as const;

export default function MarketingShell({
  lang,
  title,
  subtitle,
  children,
  showFooter = true,
}: MarketingShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const changeLang = useCallback((nextLang: Lang) => {
    router.push(localizePath(pathname, nextLang));
  }, [pathname, router]);

  const pick = useCallback((item: Localized) => (lang === "zh" ? item.zh : item.en), [lang]);

  const navLabel = useMemo(() =>
    lang === "zh" ? "切换语言" : "Toggle language", [lang]);

  const backLabel = useMemo(() =>
    lang === "zh" ? "返回" : "Back", [lang]);

  const currentYear = new Date().getFullYear();

  return (
    <LangProvider value={{ lang, setLang: changeLang }}>
      <div className="min-h-screen bg-[#0b0b0f] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
                LitStatus
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                {pick(title)}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-sm text-zinc-400">{pick(subtitle)}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher lang={lang} />
              <Link
                href={localizePath("/", lang)}
                className="btn-press rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-xs"
              >
                {backLabel}
              </Link>
            </div>
          </header>

          <nav
            aria-label="Page navigation"
            className="flex flex-wrap gap-2 text-[11px] text-zinc-400 sm:gap-3 sm:text-xs"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={localizePath(item.href, lang)}
                className="btn-press rounded-full border border-white/10 px-3 py-1.5 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2"
              >
                {pick(item.label)}
              </Link>
            ))}
          </nav>

          <main className="flex-1">{children}</main>

          {showFooter ? (
            <footer
              className="flex flex-col flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] text-zinc-500 sm:flex-row sm:pt-8 sm:text-xs"
              role="contentinfo"
            >
              <div>
                <span>© {currentYear} LitStatus</span>
              </div>
              <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {FOOTER_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={localizePath(item.href, lang)}
                    className="transition-colors hover:text-white focus:outline-none focus:underline"
                  >
                    {pick(item.label)}
                  </Link>
                ))}
              </nav>
            </footer>
          ) : null}
        </div>
      </div>

      {/* Cookie Consent Banner */}
      <CookieConsent lang={lang} />

      {/* Online/Offline Status Indicator */}
      <OnlineStatus position="bottom" />
    </LangProvider>
  );
}
