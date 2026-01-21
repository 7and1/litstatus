import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/MarketingShell";
import CaseStudyDetail from "@/components/CaseStudyDetail";
import { HreflangHead } from "@/components/HreflangHead";
import { BreadcrumbSchema, ArticleSchema } from "@/components/JsonLd";
import { buildContentMetadata, getBreadcrumbItemsForPath } from "@/lib/seo";
import { CASE_STUDIES, USE_CASES, getCaseStudy } from "@/lib/useCases";
import { localizePath } from "@/lib/i18n";
import { pick } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export function generateStaticParams() {
  return CASE_STUDIES.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug as never);
  if (!study) return {};

  return buildContentMetadata({
    title: pick("zh", study.title),
    description: pick("zh", study.description),
    path: `/case-studies/${study.slug}`,
    lang: "zh",
    keywords: study.keywords.zh,
    ogTitle: pick("zh", study.title),
    ogDescription: pick("zh", study.subtitle),
    ogImageAlt: pick("zh", study.title),
  });
}

export default async function CaseStudyPageZh({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = getCaseStudy(slug as never);
  if (!study) return notFound();

  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItemsForPath(
      `/case-studies/${study.slug}`,
      pick("zh", study.title),
      "zh",
    ),
  });

  const articleSchema = ArticleSchema({
    title: pick("zh", study.title),
    description: pick("zh", study.description),
    url: `${SITE_URL}${localizePath(`/case-studies/${study.slug}`, "zh")}`,
    lang: "zh",
  });

  return (
    <>
      <HreflangHead path={`/case-studies/${study.slug}`} />
      <Script
        id={`breadcrumbs-case-study-zh-${study.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id={`article-case-study-zh-${study.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <MarketingShell
        lang="zh"
        title={study.title}
        subtitle={study.subtitle}
      >
        <CaseStudyDetail
          lang="zh"
          study={study}
          relatedUseCases={USE_CASES}
        />
      </MarketingShell>
    </>
  );
}
