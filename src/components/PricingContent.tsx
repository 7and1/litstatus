"use client";

import { TIERS, pick } from "@/lib/content";
import { useLang } from "@/components/LangProvider";

export default function PricingContent() {
  const { lang } = useLang();

  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
      {TIERS.map((tier) => (
        <article
          key={tier.name.en}
          className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:rounded-3xl sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold sm:text-lg">
              {pick(lang, tier.name)}
            </h3>
            {tier.badge ? (
              <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-zinc-300 sm:px-3 sm:py-1">
                {pick(lang, tier.badge)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            {pick(lang, tier.description)}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-200 sm:mt-4 sm:space-y-2">
            {tier.features.map((feature) => (
              <li key={feature.en} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#2ceef0] sm:h-1.5 sm:w-1.5" />
                <span>{pick(lang, feature)}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
