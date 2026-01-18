import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import FaqContent from "@/components/FaqContent";
import { FAQS } from "@/lib/content";
import { BreadcrumbSchema, FaqSchema } from "@/components/JsonLd";
import { buildPageMetadata, getBreadcrumbItems } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("faq", "zh");

export default function FAQPageZh() {
  const faqSchema = FaqSchema({ faqs: FAQS, lang: "zh" });
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("faq", "zh"),
  });

  return (
    <>
      <Script
        id="faq-schema-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="breadcrumbs-faq-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MarketingShell
        lang="zh"
        title={{ en: "FAQ", zh: "常见问题" }}
        subtitle={{
          en: "Answers about quotas, privacy, and Pro.",
          zh: "关于配额、隐私和 Pro 的说明。",
        }}
      >
        <FaqContent />
      </MarketingShell>
    </>
  );
}
