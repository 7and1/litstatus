import type { Lang } from "@/lib/i18n";
import { generateHreflangTags } from "@/lib/i18n";

type HreflangTagsProps = {
  pathname: string;
};

/**
 * Hreflang link tags for SEO
 *
 * Renders proper hreflang links in the head to tell search engines
 * about alternate language versions of the current page.
 *
 * Must be used in a Server Component or placed in the <head> section.
 *
 * @example
 * <HreflangTags pathname="/use-cases" />
 *
 * Renders:
 * <link rel="alternate" hreflang="en" href="https://litstatus.com/use-cases" />
 * <link rel="alternate" hreflang="zh-CN" href="https://litstatus.com/zh/use-cases" />
 * <link rel="alternate" hreflang="x-default" href="https://litstatus.com/use-cases" />
 */
export function HreflangTags({ pathname }: HreflangTagsProps) {
  const tags = generateHreflangTags(pathname);

  return (
    <>
      {tags.map((tag) => (
        <link
          key={tag.lang}
          rel="alternate"
          hrefLang={tag.lang}
          href={tag.url}
        />
      ))}
    </>
  );
}

/**
 * Hreflang data for use in metadata
 * Use this in the metadataAlternates property
 *
 * @example
 * export const metadata = {
 *   alternates: {
 *     canonical: "/use-cases",
 *     languages: getHreflangLanguages("/use-cases"),
 *   },
 * };
 */
export function getHreflangLanguages(pathname: string) {
  const tags = generateHreflangTags(pathname);

  return tags.reduce(
    (acc, tag) => {
      acc[tag.lang] = tag.url;
      return acc;
    },
    {} as Record<string, string>,
  );
}
