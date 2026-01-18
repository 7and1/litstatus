import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import PricingContent from "@/components/PricingContent";
import { BreadcrumbSchema, OfferSchema } from "@/components/JsonLd";
import { buildPageMetadata, getBreadcrumbItems } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("pricing", "zh");

export default function PricingPageZh() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("pricing", "zh"),
  });

  const offerSchema = OfferSchema();

  return (
    <>
      <Script
        id="breadcrumbs-pricing-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="offer-pricing-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
      />
      <MarketingShell
        lang="zh"
        title={{ en: "Access", zh: "权限" }}
        subtitle={{
          en: "Pro is wish list only. No pricing yet.",
          zh: "Pro 目前仅预约，无定价。",
        }}
      >
        <PricingContent />
      </MarketingShell>
    </>
  );
}
