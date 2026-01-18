import type { MetadataRoute } from "next";
import { localizePath } from "@/lib/i18n";
import { CASE_STUDIES, USE_CASES } from "@/lib/useCases";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

// Static pages with SEO metadata
const staticPages = [
  {
    path: "/",
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1,
  },
  {
    path: "/use-cases",
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  },
  {
    path: "/case-studies",
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  },
  {
    path: "/examples",
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  },
  {
    path: "/pricing",
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  {
    path: "/faq",
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  },
  {
    path: "/login",
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  {
    path: "/privacy-policy",
    lastModified: new Date("2025-01-01"),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  {
    path: "/terms-of-service",
    lastModified: new Date("2025-01-01"),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
];

const dynamicPages = [
  ...USE_CASES.map((item) => ({
    path: `/use-cases/${item.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  })),
  ...CASE_STUDIES.map((item) => ({
    path: `/case-studies/${item.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL.replace(/\/$/, "");
  const pages = [...staticPages, ...dynamicPages];

  return pages.flatMap((page) => {
    const enPath = localizePath(page.path, "en");
    const zhPath = localizePath(page.path, "zh");
    const alternates = {
      languages: {
        en: `${baseUrl}${enPath}`,
        zh: `${baseUrl}${zhPath}`,
        "x-default": `${baseUrl}${enPath}`,
      },
    };

    return [
      {
        url: `${baseUrl}${enPath}`,
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates,
      },
      {
        url: `${baseUrl}${zhPath}`,
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates,
      },
    ];
  });
}
