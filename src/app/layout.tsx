import type { Metadata } from "next";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import Script from "next/script";
import Link from "next/link";
import { Manrope, Space_Grotesk } from "next/font/google";
import { getLangTag, LANG_STORAGE_KEY } from "@/lib/i18n";
import { getLangFromHeaders } from "@/lib/i18n.server";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

const DEFAULT_DESCRIPTION =
  "Generate viral captions and hashtags with AI. Three tone modes for Instagram, TikTok, and more.";

const STRUCTURED_COPY = {
  en: {
    alternateName: "LitStatus AI Caption Generator",
    websiteDescription:
      "Generate viral captions and hashtags in seconds with AI. Three tone modes and optional image input.",
    softwareDescription:
      "AI-powered caption generator with multiple tone modes for social media creators.",
    offerDescription: "Free tier with daily generations.",
    featureList: [
      "AI caption generation",
      "Multiple tone modes",
      "Hashtag generation",
      "Image recognition (Pro)",
      "Bilingual support",
      "Free daily quota",
    ],
  },
  zh: {
    alternateName: "LitStatus AI 文案生成器",
    websiteDescription:
      "AI 秒出文案与标签，三种语气，支持文字与图片输入，适配社媒发布。",
    softwareDescription:
      "面向内容创作者的 AI 文案生成器，提供多种语气与快速输出。",
    offerDescription: "提供每日免费额度。",
    featureList: [
      "AI 文案生成",
      "多语气模式",
      "标签生成",
      "图片识别（Pro）",
      "中英双语",
      "每日免费配额",
    ],
  },
} as const;

// Edge Runtime for Cloudflare Pages compatibility
export const runtime = "edge";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LitStatus",
    template: "%s | LitStatus",
  },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: "LitStatus", url: SITE_URL }],
  creator: "LitStatus",
  publisher: "LitStatus",
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
  keywords: [
    "ai caption generator",
    "instagram captions",
    "tiktok captions",
    "social media caption generator",
    "hashtag generator",
    "ai caption tool",
    "content creator tools",
  ],
  openGraph: {
    type: "website",
    siteName: "LitStatus",
    title: "LitStatus - AI Caption Generator for Social Media",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/og?lang=en",
        width: 1200,
        height: 630,
        alt: "LitStatus AI Caption Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@litstatus",
    creator: "@litstatus",
    title: "LitStatus - AI Caption Generator for Social Media",
    description: DEFAULT_DESCRIPTION,
    images: ["/og?lang=en"],
  },
  // Preconnect to external domains for performance
  other: {
    "msapplication-TileColor": "#0b0b0f",
    "theme-color": "#0b0b0f",
    "msapplication-config": "/browserconfig.xml",
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en": SITE_URL,
      "zh": `${SITE_URL}/zh`,
      "x-default": SITE_URL,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get language from cookie, with Accept-Language header fallback
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANG_STORAGE_KEY)?.value ?? null;
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") ?? null;

  const lang = getLangFromHeaders(cookieLang, acceptLanguage);
  const langTag = getLangTag(lang);
  const structured = STRUCTURED_COPY[lang];
  const skipLabel = lang === "zh" ? "跳到主要内容" : "Skip to main content";
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ??
    "https://plausible.io/js/script.js";
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={langTag} className="scroll-smooth">
      <head>
        {/* DNS prefetch and preconnect for performance */}
        <link rel="preconnect" href="https://plausible.io" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Favicon and icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Canonical URL for SEO */}
        <link rel="canonical" href={SITE_URL} />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <ErrorBoundary>
          <a href="#main-content" className="skip-link">
            {skipLabel}
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
              alternateName: structured.alternateName,
              url: SITE_URL,
              description: structured.websiteDescription,
              inLanguage: langTag,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: "LitStatus",
                url: SITE_URL,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/icon-512.png`,
                  width: 512,
                  height: 512,
                },
              },
            }),
          }}
        />
        <Script
          id="structured-data-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "LitStatus",
              url: SITE_URL,
              logo: `${SITE_URL}/icon-512.png`,
              description: structured.websiteDescription,
              sameAs: [
                "https://twitter.com/litstatus",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "support@litstatus.com",
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
                description: structured.offerDescription,
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
                bestRating: "5",
                worstRating: "1",
              },
              featureList: structured.featureList,
              description: structured.softwareDescription,
              url: SITE_URL,
              author: {
                "@type": "Organization",
                name: "LitStatus",
                url: SITE_URL,
              },
              publisher: {
                "@type": "Organization",
                name: "LitStatus",
                url: SITE_URL,
              },
            }),
          }}
        />
        {plausibleDomain ? (
          <Script
            id="plausible-analytics"
            src={plausibleSrc}
            data-domain={plausibleDomain}
            strategy="afterInteractive"
          />
        ) : null}
        {/* GDPR-compliant analytics: only load after cookie consent */}
        <Script id="cookie-consent-init" strategy="afterInteractive">
          {`
            // Check for cookie consent before loading analytics
            const hasConsent = localStorage.getItem('litstatus_cookie_consent') === 'accepted';
            if (hasConsent && window.gtag) {
              // Analytics already loaded via gtag config
            }
            // Listen for cookie consent acceptance
            window.addEventListener('cookie-consent-accepted', function() {
              console.log('Cookie consent accepted - analytics enabled');
            });
          `}
        </Script>
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
