import { getAlternatePaths } from "@/lib/i18n";

type HreflangHeadProps = {
  path: string;
};

/**
 * Adds hreflang link tags to the page head for SEO
 * Usage: Add to the head section of any page
 *
 * @example
 * <HreflangHead path="/use-cases/instagram" />
 */
export function HreflangHead({ path }: HreflangHeadProps) {
  const alternates = getAlternatePaths(path);

  return (
    <>
      <link
        rel="alternate"
        hrefLang="en"
        href={alternates.en}
      />
      <link
        rel="alternate"
        hrefLang="zh-CN"
        href={alternates["zh-CN"]}
      />
      <link
        rel="alternate"
        hrefLang="x-default"
        href={alternates["x-default"]}
      />
    </>
  );
}
