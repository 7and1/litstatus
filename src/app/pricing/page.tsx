import type { Metadata } from "next";
import MarketingShell from "@/components/MarketingShell";
import PricingContent from "@/components/PricingContent";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export const metadata: Metadata = {
  title: "Pricing & Access Plans - Free & Pro Tiers",
  description:
    "Compare LitStatus access plans: Guest (3 free daily), User (20 daily with all modes), and Pro (unlimited with vision upload). No credit card required for free tier.",
  keywords: [
    "caption generator pricing",
    "free caption tool",
    "pro caption generator",
    "ai caption subscription",
    "unlimited captions",
    "caption generator free trial",
    "social media tool pricing",
    "litstatus pricing",
  ],
  openGraph: {
    title: "Pricing & Access Plans - Free & Pro Tiers | LitStatus",
    description:
      "Compare LitStatus access plans: Guest (3 free daily), User (20 daily with all modes), and Pro (unlimited with vision upload).",
    url: `${SITE_URL}/pricing`,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LitStatus Pricing Plans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing & Access Plans - Free & Pro Tiers | LitStatus",
    description:
      "Compare LitStatus access plans: Guest (3 free daily), User (20 daily with all modes), and Pro (unlimited with vision upload).",
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <MarketingShell
      title={{ en: "Access", zh: "权限" }}
      subtitle={{
        en: "Pro is wish list only. No pricing yet.",
        zh: "Pro 目前仅预约，无定价。",
      }}
    >
      <PricingContent />
    </MarketingShell>
  );
}
