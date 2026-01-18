import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import type { CaseStudy, UseCase } from "@/lib/useCases";

const pick = (lang: Lang, item: { en: string; zh: string }) =>
  lang === "zh" ? item.zh : item.en;

export default function UseCaseDetail({
  lang,
  useCase,
  related,
  caseStudies,
}: {
  lang: Lang;
  useCase: UseCase;
  related: UseCase[];
  caseStudies: CaseStudy[];
}) {
  const generatorHref = `${localizePath("/", lang)}#generator`;

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          {lang === "zh" ? "使用场景" : "Use case"}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          {pick(lang, useCase.title)}
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          {pick(lang, useCase.subtitle)}
        </p>
        <p className="mt-4 text-base text-zinc-300">
          {pick(lang, useCase.description)}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={generatorHref}
            className="btn-press rounded-full bg-[#2ceef0] px-4 py-2 text-xs font-semibold text-black"
          >
            {lang === "zh" ? "立即生成文案" : "Generate captions"}
          </Link>
          <Link
            href={localizePath("/examples", lang)}
            className="btn-press rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-200"
          >
            {lang === "zh" ? "查看示例" : "See examples"}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">
            {lang === "zh" ? "核心亮点" : "Key highlights"}
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            {useCase.highlights.map((item) => (
              <li key={item.en} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#2ceef0]" />
                <span>{pick(lang, item)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">
            {lang === "zh" ? "适合内容" : "Best for"}
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            {useCase.bestFor.map((item) => (
              <li key={item.en} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#f6b73c]" />
                <span>{pick(lang, item)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
            {lang === "zh" ? "模板示例" : "Prompt templates"}
          </p>
          <h3 className="mt-2 text-xl font-semibold">
            {lang === "zh" ? "直接可用" : "Ready-to-copy"}
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {useCase.prompts.map((prompt) => (
            <div
              key={prompt.input.en}
              className="rounded-3xl border border-white/10 bg-black/40 p-5"
            >
              <p className="text-xs text-zinc-500">{prompt.mode}</p>
              <p className="mt-2 text-sm text-zinc-300">
                {pick(lang, prompt.input)}
              </p>
              <p className="mt-3 text-base text-white">
                {pick(lang, prompt.caption)}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                {prompt.hashtags}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">
            {lang === "zh" ? "更多使用场景" : "More use cases"}
          </h3>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={localizePath(`/use-cases/${item.slug}`, lang)}
                className="block rounded-2xl border border-white/10 px-4 py-3 transition hover:border-white/30 hover:bg-white/5"
              >
                {pick(lang, item.title)}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">
            {lang === "zh" ? "长文案例" : "Case studies"}
          </h3>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            {caseStudies.map((item) => (
              <Link
                key={item.slug}
                href={localizePath(`/case-studies/${item.slug}`, lang)}
                className="block rounded-2xl border border-white/10 px-4 py-3 transition hover:border-white/30 hover:bg-white/5"
              >
                {pick(lang, item.title)}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
