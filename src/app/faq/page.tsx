import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import FaqContent from "@/components/FaqContent";
import { FAQS } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export const metadata: Metadata = {
  title: "FAQ - Common Questions About AI Caption Generator",
  description:
    "Find answers to frequently asked questions about LitStatus AI caption generator. Learn about quotas, privacy, tone modes (Standard, Savage, Rizz), Pro features, and language support.",
  keywords: [
    "caption generator faq",
    "litstatus faq",
    "ai caption questions",
    "how to use caption generator",
    "caption generator privacy",
    "free caption generator",
    "caption quota",
    "pro caption features",
  ],
  openGraph: {
    title: "FAQ - Common Questions About AI Caption Generator | LitStatus",
    description:
      "Find answers to frequently asked questions about LitStatus AI caption generator. Learn about quotas, privacy, tone modes, Pro features, and language support.",
    url: `${SITE_URL}/faq`,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LitStatus FAQ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ - Common Questions About AI Caption Generator | LitStatus",
    description:
      "Find answers to frequently asked questions about LitStatus AI caption generator.",
  },
  alternates: {
    canonical: "/faq",
  },
};

export default function FAQPage() {
  // Generate FAQ schema for structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question.en,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.en,
      },
    })),
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <MarketingShell
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
