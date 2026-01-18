import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import { BreadcrumbSchema, CollectionSchema } from "@/components/JsonLd";
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

export const metadata: Metadata = buildPageMetadata("case-studies", "en");

export default function CaseStudiesPage() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("case-studies", "en"),
  });

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Case Studies - Content Strategy Playbooks",
    description: "In-depth case studies showing how creators and brands plan and execute caption strategies across multiple social platforms.",
    url: `${SITE_URL}/case-studies`,
    inLanguage: "en",
    about: {
      "@type": "SoftwareApplication",
      name: "LitStatus",
    },
  };

  return (
    <>
      <Script
        id="breadcrumbs-case-studies"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="collection-case-studies"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <MarketingShell
        lang="en"
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
              href={localizePath(`/case-studies/${item.slug}`, "en")}
              className="rounded-3xl border border-white/10 bg-black/40 p-5 transition hover:border-white/30 hover:bg-white/5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                {pick("en", CASE_STUDY_LABELS[item.slug] || CATEGORY_LABEL)}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {pick("en", item.title)}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{pick("en", item.subtitle)}</p>
            </Link>
          ))}
        </div>
      </MarketingShell>
    </>
  );
}
