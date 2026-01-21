import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/MarketingShell";
import UseCaseDetail from "@/components/UseCaseDetail";
import { HreflangHead } from "@/components/HreflangHead";
import { BreadcrumbSchema, HowToSchema, ArticleSchema } from "@/components/JsonLd";
import { buildContentMetadata, getBreadcrumbItemsForPath } from "@/lib/seo";
import { USE_CASES, CASE_STUDIES, getUseCase } from "@/lib/useCases";
import { localizePath } from "@/lib/i18n";
import { pick } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export function generateStaticParams() {
  return USE_CASES.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCase(slug as never);
  if (!useCase) return {};

  return buildContentMetadata({
    title: pick("en", useCase.title),
    description: pick("en", useCase.description),
    path: `/use-cases/${useCase.slug}`,
    lang: "en",
    keywords: useCase.keywords.en,
    ogTitle: pick("en", useCase.title),
    ogDescription: pick("en", useCase.subtitle),
    ogImageAlt: pick("en", useCase.title),
  });
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const useCase = getUseCase(slug as never);
  if (!useCase) return notFound();

  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItemsForPath(
      `/use-cases/${useCase.slug}`,
      pick("en", useCase.title),
      "en",
    ),
  });

  const articleSchema = ArticleSchema({
    title: pick("en", useCase.title),
    description: pick("en", useCase.description),
    url: `${SITE_URL}${localizePath(`/use-cases/${useCase.slug}`, "en")}`,
    lang: "en",
  });

  const howToSchema = HowToSchema({
    name: pick("en", useCase.title),
    description: pick("en", useCase.description),
    lang: "en",
    steps: [
      {
        name: "Choose your tone mode",
        text: "Select from Standard, Savage, or Rizz tone mode based on your content style.",
      },
      {
        name: "Input your content",
        text: "Enter your photo description, video topic, or upload an image for context.",
      },
      {
        name: "Generate captions",
        text: "Get AI-generated captions optimized for the platform with relevant hashtags.",
      },
    ],
  });

  const related = USE_CASES.filter((item) => item.slug !== useCase.slug);

  return (
    <>
      <HreflangHead path={`/use-cases/${useCase.slug}`} />
      <Script
        id={`breadcrumbs-use-case-${useCase.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id={`article-use-case-${useCase.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Script
        id={`howto-use-case-${useCase.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <MarketingShell
        lang="en"
        title={useCase.title}
        subtitle={useCase.subtitle}
      >
        <UseCaseDetail
          lang="en"
          useCase={useCase}
          related={related}
          caseStudies={CASE_STUDIES}
        />
      </MarketingShell>
    </>
  );
}
