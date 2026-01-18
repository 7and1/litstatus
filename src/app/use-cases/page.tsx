import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import { BreadcrumbSchema, CollectionSchema } from "@/components/JsonLd";
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

export const metadata: Metadata = buildPageMetadata("use-cases", "en");

export default function UseCasesPage() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("use-cases", "en"),
  });

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Platform Use Cases - Instagram, TikTok, and Xiaohongshu",
    description: "Platform-specific caption strategies for Instagram, TikTok, and Xiaohongshu. Learn hooks, tone techniques, and hashtag tactics that feel native to each platform.",
    url: `${SITE_URL}/use-cases`,
    inLanguage: "en",
    about: {
      "@type": "SoftwareApplication",
      name: "LitStatus",
    },
  };

  return (
    <>
      <Script
        id="breadcrumbs-use-cases"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="collection-use-cases"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <MarketingShell
        lang="en"
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
              href={localizePath(`/use-cases/${item.slug}`, "en")}
              className="rounded-3xl border border-white/10 bg-black/40 p-5 transition hover:border-white/30 hover:bg-white/5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                {pick("en", SLUG_LABELS[item.slug] || { en: item.slug, zh: item.slug })}
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
