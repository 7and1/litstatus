import Script from "next/script";
import { useId } from "react";
import type { Lang } from "@/lib/i18n";

type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * JSON-LD Structured Data component for SEO
 * Renders schema.org markup for search engines
 */
export default function JsonLd({ data }: JsonLdProps) {
  const id = useId();
  return (
    <Script
      id={`json-ld-${id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Generate FAQPage schema with language support
 */
export function FaqSchema({
  faqs,
  lang,
}: {
  faqs: Array<{
    question: { en: string; zh: string };
    answer: { en: string; zh: string };
  }>;
  lang: Lang;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang === "zh" ? "zh-CN" : "en",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question[lang],
      inLanguage: lang === "zh" ? "zh-CN" : "en",
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer[lang],
        inLanguage: lang === "zh" ? "zh-CN" : "en",
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; item: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

/**
 * Generate Organization schema with bilingual support
 */
export function OrganizationSchema(lang?: Lang) {
  const descriptions: Record<Lang, string> = {
    en: "AI-powered caption generator for social media. Generate viral captions and hashtags instantly with multiple tone modes.",
    zh: "AI 文案生成器，专为社交媒体打造。即时生成爆款文案与标签，支持多种语气模式。",
  };

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LitStatus",
    url: "https://litstatus.com",
    logo: "https://litstatus.com/logo.png",
    description: descriptions[lang || "en"],
    inLanguage: lang === "zh" ? "zh-CN" : "en",
    sameAs: ["https://twitter.com/litstatus", "https://github.com/litstatus"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@litstatus.com",
      availableLanguage: lang === "zh" ? ["zh-CN", "en"] : ["en", "zh-CN"],
    },
  };
}

/**
 * Generate Product/Offer schema for Pro tier
 */
export function OfferSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: "LitStatus Pro",
    category: "Software as a Service",
    priceCurrency: "USD",
    price: "0",
    description: "Free tier with 3 daily generations",
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: "LitStatus",
    },
  };
}

/**
 * Generate Article schema for use cases and case studies with language support
 */
export function ArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author,
  url,
  imageUrl,
  lang,
}: {
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  url: string;
  imageUrl?: string;
  lang?: Lang;
}) {
  const image = imageUrl ?? `https://litstatus.com/og?lang=${lang || "en"}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    image: image,
    datePublished: datePublished ?? new Date().toISOString().split("T")[0],
    dateModified: dateModified ?? new Date().toISOString().split("T")[0],
    inLanguage: lang === "zh" ? "zh-CN" : "en",
    author: {
      "@type": "Organization",
      name: author ?? "LitStatus",
    },
    publisher: {
      "@type": "Organization",
      name: "LitStatus",
      logo: {
        "@type": "ImageObject",
        url: "https://litstatus.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/**
 * Generate HowTo schema for use cases with language support
 */
export function HowToSchema({
  name,
  description,
  steps,
  imageUrl,
  lang,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  imageUrl?: string;
  lang?: Lang;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: name,
    description: description,
    image: imageUrl ?? `https://litstatus.com/og?lang=${lang || "en"}`,
    inLanguage: lang === "zh" ? "zh-CN" : "en",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * Generate VideoObject schema for video content
 */
export function VideoSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: name,
    description: description,
    thumbnailUrl: thumbnailUrl,
    uploadDate: uploadDate,
    duration: duration,
  };
}

/**
 * Generate CollectionPage schema with language support
 */
export function CollectionSchema({
  name,
  description,
  url,
  lang,
}: {
  name: string;
  description: string;
  url: string;
  lang?: Lang;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: name,
    description: description,
    url: url,
    inLanguage: lang === "zh" ? "zh-CN" : "en",
  };
}
