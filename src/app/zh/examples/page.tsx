import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import ExamplesContent from "@/components/ExamplesContent";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildPageMetadata, getBreadcrumbItems } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export const metadata: Metadata = buildPageMetadata("examples", "zh");

export default function ExamplesPageZh() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("examples", "zh"),
  });

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI 文案示例 - 真实生成输出",
    description: "浏览 LitStatus 在 Standard、Savage、Rizz 三种语气模式下的真实文案输出，以及适配 Instagram 和 TikTok 的精选标签。",
    url: `${SITE_URL}/zh/examples`,
    inLanguage: "zh-CN",
    about: {
      "@type": "SoftwareApplication",
      name: "LitStatus",
    },
  };

  return (
    <>
      <Script
        id="breadcrumbs-examples-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="collection-examples-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <MarketingShell
        lang="zh"
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
