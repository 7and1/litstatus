"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadLang, saveLang, type Lang } from "@/lib/i18n";
import type { Localized } from "@/lib/content";
import { LangProvider } from "@/components/LangProvider";

type MarketingShellProps = {
  title: Localized;
  subtitle?: Localized;
  children: React.ReactNode;
};

const NAV = [
  { href: "/", label: { en: "Home", zh: "主页" } },
  { href: "/examples", label: { en: "Examples", zh: "示例" } },
  { href: "/pricing", label: { en: "Access", zh: "权限" } },
  { href: "/faq", label: { en: "FAQ", zh: "问题" } },
];

export default function MarketingShell({
  title,
  subtitle,
  children,
}: MarketingShellProps) {
  const [lang, setLang] = useState<Lang>(() => loadLang());

  useEffect(() => {
    saveLang(lang);
  }, [lang]);

  const pick = (item: Localized) => (lang === "zh" ? item.zh : item.en);

  return (
    <LangProvider value={{ lang, setLang }}>
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
              <button
                onClick={() => setLang(lang === "en" ? "zh" : "en")}
                className="btn-press rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-xs"
                aria-label="Toggle language"
              >
                EN / 中文
              </button>
              <Link
                href="/"
                className="btn-press rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-xs"
              >
                {lang === "zh" ? "返回" : "Back"}
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
                href={item.href}
                className="btn-press rounded-full border border-white/10 px-3 py-1.5 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2"
              >
                {pick(item.label)}
              </Link>
            ))}
          </nav>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </LangProvider>
  );
}
