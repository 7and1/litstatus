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

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const useCase = getUseCase(params.slug as never);
  if (!useCase) return {};

  return buildContentMetadata({
    title: pick("zh", useCase.title),
    description: pick("zh", useCase.description),
    path: `/use-cases/${useCase.slug}`,
    lang: "zh",
    keywords: useCase.keywords.zh,
    ogTitle: pick("zh", useCase.title),
    ogDescription: pick("zh", useCase.subtitle),
    ogImageAlt: pick("zh", useCase.title),
  });
}

export default function UseCasePageZh({ params }: { params: { slug: string } }) {
  const useCase = getUseCase(params.slug as never);
  if (!useCase) return notFound();

  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItemsForPath(
      `/use-cases/${useCase.slug}`,
      pick("zh", useCase.title),
      "zh",
    ),
  });

  const articleSchema = ArticleSchema({
    title: pick("zh", useCase.title),
    description: pick("zh", useCase.description),
    url: `${SITE_URL}${localizePath(`/use-cases/${useCase.slug}`, "zh")}`,
    lang: "zh",
  });

  const howToSchema = HowToSchema({
    name: pick("zh", useCase.title),
    description: pick("zh", useCase.description),
    lang: "zh",
    steps: [
      {
        name: "选择语气模式",
        text: "根据内容风格选择标准、犀利或撩人语气模式。",
      },
      {
        name: "输入内容",
        text: "输入照片描述、视频主题或上传图片以提供上下文。",
      },
      {
        name: "生成文案",
        text: "获取平台优化的 AI 生成文案及相关标签。",
      },
    ],
  });

  const related = USE_CASES.filter((item) => item.slug !== useCase.slug);

  return (
    <>
      <HreflangHead path={`/use-cases/${useCase.slug}`} />
      <Script
        id={`breadcrumbs-use-case-zh-${useCase.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id={`article-use-case-zh-${useCase.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Script
        id={`howto-use-case-zh-${useCase.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <MarketingShell
        lang="zh"
        title={useCase.title}
        subtitle={useCase.subtitle}
      >
        <UseCaseDetail
          lang="zh"
          useCase={useCase}
          related={related}
          caseStudies={CASE_STUDIES}
        />
      </MarketingShell>
    </>
  );
}
