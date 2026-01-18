import type { Metadata } from "next";
import Script from "next/script";
import LoginClient from "@/components/LoginClient";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildPageMetadata, getBreadcrumbItems } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("login", "en");

export default function LoginPage() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItems("login", "en"),
  });

  return (
    <>
      <Script
        id="breadcrumbs-login"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LoginClient lang="en" />
    </>
  );
}
