import type { Metadata } from "next";
import Script from "next/script";
import LoginClient from "@/components/LoginClient";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildPageMetadata, getBreadcrumbItems } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("login", "zh");

export default function LoginPageZh() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("login", "zh"),
  });

  return (
    <>
      <Script
        id="breadcrumbs-login-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LoginClient lang="zh" />
    </>
  );
}
