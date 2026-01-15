import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

const SEO_TITLE =
  "LitStatus - AI Caption Generator for Instagram & TikTok | Viral Social Media Captions";
const SEO_DESCRIPTION =
  "Generate viral captions and hashtags instantly with AI. 3 tone modes: Standard, Savage, Rizz. Supports text and image input. English & Chinese. Free daily quota.";

const SEO_KEYWORDS = [
  "caption generator",
  "instagram captions",
  "tiktok captions",
  "ai caption tool",
  "social media captions",
  "caption writer",
  "hashtag generator",
  "rizz captions",
  "savage captions",
  "viral captions",
  "instagram caption generator",
  "tiktok caption generator",
  "ai writing assistant",
  "social media tools",
  "content creation",
  "caption maker",
  "auto captions",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_TITLE,
    template: "%s | LitStatus",
  },
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: "LitStatus", url: SITE_URL }],
  creator: "LitStatus",
  publisher: "LitStatus",
  alternates: {
    canonical: "/",
    languages: {
      en: "https://litstatus.com",
      zh: "https://litstatus.com/zh",
      "x-default": "https://litstatus.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: SITE_URL,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    siteName: "LitStatus",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LitStatus - AI Caption Generator",
      },
      {
        url: "/og-image-square.png",
        width: 1200,
        height: 1200,
        alt: "LitStatus - AI Caption Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@litstatus",
    creator: "@litstatus",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  applicationName: "LitStatus",
  category: "Social Media Tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ??
    "https://plausible.io/js/script.js";
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="alternate" hrefLang="en" href="https://litstatus.com" />
        <link rel="alternate" hrefLang="zh" href="https://litstatus.com" />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://litstatus.com"
        />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* JSON-LD Structured Data */}
        <Script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "LitStatus",
              alternateName: "LitStatus AI Caption Generator",
              url: SITE_URL,
              description: SEO_DESCRIPTION,
              inLanguage: ["en", "zh"],
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Script
          id="structured-data-software"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "LitStatus",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free tier with 3 daily generations",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
                bestRating: "5",
                worstRating: "1",
              },
              featureList: [
                "AI caption generation",
                "Multiple tone modes (Standard, Savage, Rizz)",
                "Hashtag generation",
                "Image recognition",
                "Multi-language support",
                "Free daily quota",
              ],
              description: SEO_DESCRIPTION,
              url: SITE_URL,
              author: {
                "@type": "Organization",
                name: "LitStatus",
                url: SITE_URL,
              },
            }),
          }}
        />
        {plausibleDomain ? (
          <Script
            src={plausibleSrc}
            data-domain={plausibleDomain}
            strategy="afterInteractive"
          />
        ) : null}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
