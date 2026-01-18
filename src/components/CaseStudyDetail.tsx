import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import type { CaseStudy, UseCase } from "@/lib/useCases";

const pick = (lang: Lang, item: { en: string; zh: string }) =>
  lang === "zh" ? item.zh : item.en;

export default function CaseStudyDetail({
  lang,
  study,
  relatedUseCases,
}: {
  lang: Lang;
  study: CaseStudy;
  relatedUseCases: UseCase[];
}) {
  const generatorHref = `${localizePath("/", lang)}#generator`;

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          {lang === "zh" ? "长文案例" : "Case study"}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          {pick(lang, study.title)}
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          {pick(lang, study.subtitle)}
        </p>
        <p className="mt-4 text-base text-zinc-300">
          {pick(lang, study.description)}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={generatorHref}
            className="btn-press rounded-full bg-[#2ceef0] px-4 py-2 text-xs font-semibold text-black"
          >
            {lang === "zh" ? "开始生成" : "Start generating"}
          </Link>
          <Link
            href={localizePath("/use-cases", lang)}
            className="btn-press rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-200"
          >
            {lang === "zh" ? "查看使用场景" : "View use cases"}
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold">
          {lang === "zh" ? "关键要点" : "Key takeaways"}
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          {study.highlights.map((item) => (
            <li key={item.en} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#2ceef0]" />
              <span>{pick(lang, item)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        {study.sections.map((section) => (
          <div
            key={section.title.en}
            className="rounded-3xl border border-white/10 bg-black/40 p-6"
          >
            <h3 className="text-lg font-semibold">
              {pick(lang, section.title)}
            </h3>
            <div className="mt-3 space-y-3 text-sm text-zinc-300">
              {section.body.map((paragraph) => (
                <p key={paragraph.en}>{pick(lang, paragraph)}</p>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold">
          {lang === "zh" ? "相关使用场景" : "Related use cases"}
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {relatedUseCases.map((item) => (
            <Link
              key={item.slug}
              href={localizePath(`/use-cases/${item.slug}`, lang)}
              className="block rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:border-white/30 hover:bg-white/5"
            >
              {pick(lang, item.title)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
