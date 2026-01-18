import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildPageMetadata, getBreadcrumbItems } from "@/lib/seo";
import { USE_CASES } from "@/lib/useCases";
import { localizePath } from "@/lib/i18n";
import { pick } from "@/lib/content";
import type { Localized } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

const SLUG_LABELS: Record<string, Localized> = {
  instagram: { en: "Instagram", zh: "Instagram" },
  tiktok: { en: "TikTok", zh: "TikTok" },
  xiaohongshu: { en: "Xiaohongshu", zh: "小红书" },
};

export const metadata: Metadata = buildPageMetadata("use-cases", "zh");

export default function UseCasesPageZh() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("use-cases", "zh"),
  });

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "平台使用场景 - Instagram、TikTok 与小红书",
    description: "针对 Instagram、TikTok 和小红书的平台专属文案策略。学习让文案在各个平台更具原生感的钩子技巧、语气方法和标签策略。",
    url: `${SITE_URL}/zh/use-cases`,
    inLanguage: "zh-CN",
    about: {
      "@type": "SoftwareApplication",
      name: "LitStatus",
    },
  };

  return (
    <>
      <Script
        id="breadcrumbs-use-cases-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="collection-use-cases-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <MarketingShell
        lang="zh"
        title={{ en: "Use cases", zh: "使用场景" }}
        subtitle={{
          en: "Platform-specific caption playbooks for Instagram, TikTok, and Xiaohongshu.",
          zh: "按平台拆解的文案打法：Instagram、TikTok、小红书。",
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {USE_CASES.map((item) => (
            <Link
              key={item.slug}
              href={localizePath(`/use-cases/${item.slug}`, "zh")}
              className="rounded-3xl border border-white/10 bg-black/40 p-5 transition hover:border-white/30 hover:bg-white/5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                {pick("zh", SLUG_LABELS[item.slug] || { en: item.slug, zh: item.slug })}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {pick("zh", item.title)}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{pick("zh", item.subtitle)}</p>
            </Link>
          ))}
        </div>
      </MarketingShell>
    </>
  );
}
