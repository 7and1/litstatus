"use client";

import { EXAMPLES, pick } from "@/lib/content";
import { useLang } from "@/components/LangProvider";

export default function ExamplesContent() {
  const { lang } = useLang();

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
      {EXAMPLES.map((example) => (
        <article
          key={example.title.en}
          className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:rounded-3xl sm:p-6"
        >
          <p className="text-[10px] text-zinc-500 sm:text-xs">
            {pick(lang, example.title)}
          </p>
          <p className="mt-2 text-sm text-zinc-400 sm:mt-3">
            {pick(lang, example.input)}
          </p>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/50 p-3 sm:mt-4 sm:rounded-2xl sm:p-4">
            <p className="text-[10px] text-zinc-500 sm:text-xs">
              {example.mode}
            </p>
            <p className="mt-1.5 text-sm text-white sm:mt-2">
              {pick(lang, example.caption)}
            </p>
            <p className="mt-1.5 text-[11px] text-zinc-300 sm:mt-2 sm:text-xs">
              {example.hashtags}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400 sm:mt-3 sm:text-xs">
            {pick(lang, example.affiliate)}
          </p>
        </article>
      ))}
    </div>
  );
}
