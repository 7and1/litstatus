import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildPageMetadata, getBreadcrumbItems } from "@/lib/seo";
import { CASE_STUDIES } from "@/lib/useCases";
import { localizePath } from "@/lib/i18n";
import { pick } from "@/lib/content";
import type { Localized } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

const CASE_STUDY_LABELS: Record<string, Localized> = {
  "creator-sprint": { en: "Creator Sprint", zh: "创作者冲刺" },
  "brand-launch": { en: "Brand Launch", zh: "品牌发布" },
};

const CATEGORY_LABEL: Localized = { en: "Case study", zh: "长文案例" };

export const metadata: Metadata = buildPageMetadata("case-studies", "zh");

export default function CaseStudiesPageZh() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("case-studies", "zh"),
  });

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "案例研究 - 内容策略攻略",
    description: "深度案例研究，展示创作者和品牌如何在多个社交平台上规划和执行跨平台文案策略。",
    url: `${SITE_URL}/zh/case-studies`,
    inLanguage: "zh-CN",
    about: {
      "@type": "SoftwareApplication",
      name: "LitStatus",
    },
  };

  return (
    <>
      <Script
        id="breadcrumbs-case-studies-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="collection-case-studies-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <MarketingShell
        lang="zh"
        title={{ en: "Case studies", zh: "长文案例" }}
        subtitle={{
          en: "Long-form playbooks for creators and brand teams.",
          zh: "适合创作者与品牌团队的长文打法。",
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {CASE_STUDIES.map((item) => (
            <Link
              key={item.slug}
              href={localizePath(`/case-studies/${item.slug}`, "zh")}
              className="rounded-3xl border border-white/10 bg-black/40 p-5 transition hover:border-white/30 hover:bg-white/5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                {pick("zh", CASE_STUDY_LABELS[item.slug] || CATEGORY_LABEL)}
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
