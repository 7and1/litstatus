import Script from "next/script";
import { useId } from "react";

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
 * Generate FAQPage schema
 */
export function FaqSchema({
  faqs,
}: {
  faqs: Array<{
    question: { en: string; zh: string };
    answer: { en: string; zh: string };
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question.en,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.en,
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
 * Generate Organization schema
 */
export function OrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LitStatus",
    url: "https://litstatus.com",
    logo: "https://litstatus.com/logo.png",
    description:
      "AI-powered caption generator for social media. Generate viral captions and hashtags instantly with multiple tone modes.",
    sameAs: ["https://twitter.com/litstatus", "https://github.com/litstatus"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@litstatus.com",
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
