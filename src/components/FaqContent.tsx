"use client";

import { FAQS, pick } from "@/lib/content";
import { useLang } from "@/components/LangProvider";

export default function FaqContent() {
  const { lang } = useLang();

  return (
    <div
      className="grid gap-3 sm:gap-4 md:grid-cols-2"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      {FAQS.map((faq) => (
        <article
          key={faq.question.en}
          className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:rounded-3xl sm:p-6"
          itemScope
          itemProp="mainEntity"
          itemType="https://schema.org/Question"
        >
          <h3 className="text-sm font-semibold sm:text-base" itemProp="name">
            {pick(lang, faq.question)}
          </h3>
          <div
            itemScope
            itemProp="acceptedAnswer"
            itemType="https://schema.org/Answer"
          >
            <p className="mt-2 text-sm text-zinc-400 sm:mt-3" itemProp="text">
              {pick(lang, faq.answer)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
