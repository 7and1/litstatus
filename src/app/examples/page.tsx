import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import ExamplesContent from "@/components/ExamplesContent";
import { BreadcrumbSchema, CollectionSchema } from "@/components/JsonLd";
import { buildPageMetadata, getBreadcrumbItems } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export const metadata: Metadata = buildPageMetadata("examples", "en");

export default function ExamplesPage() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("examples", "en"),
  });

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Caption Examples - Real Generated Outputs",
    description: "Explore real LitStatus outputs across Standard, Savage, and Rizz tone modes with curated hashtags for Instagram and TikTok.",
    url: `${SITE_URL}/examples`,
    inLanguage: "en",
    about: {
      "@type": "SoftwareApplication",
      name: "LitStatus",
    },
  };

  return (
    <>
      <Script
        id="breadcrumbs-examples"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="collection-examples"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <MarketingShell
        lang="en"
        title={{ en: "Examples", zh: "示例" }}
        subtitle={{
          en: "Real outputs across modes, ready to copy.",
          zh: "覆盖多种语气的真实示例。",
        }}
      >
        <ExamplesContent />
      </MarketingShell>
    </>
  );
}
