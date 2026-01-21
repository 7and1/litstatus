import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildContentMetadata, getBreadcrumbItemsForPath } from "@/lib/seo";
import { localizePath } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export const metadata: Metadata = buildContentMetadata({
  title: "Terms of Service — LitStatus",
  description: "Read our Terms of Service to understand the rules and guidelines for using LitStatus AI caption generator. Your rights, responsibilities, and service limitations.",
  path: "/terms-of-service",
  lang: "en",
  keywords: [
    "terms of service",
    "terms and conditions",
    "user agreement",
    "legal terms",
    "service terms",
  ],
  ogTitle: "Terms of Service — LitStatus",
  ogDescription: "Terms and conditions for using LitStatus AI caption generator.",
  ogImageAlt: "LitStatus Terms of Service page",
});

export default function TermsOfServicePage() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItemsForPath(
      "/terms-of-service",
      "Terms of Service",
      "en",
    ),
  });

  return (
    <>
      <Script
        id="breadcrumbs-terms-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MarketingShell
        lang="en"
        title={{ en: "Terms of Service", zh: "服务条款" }}
        subtitle={{
          en: "Last updated: January 2025",
          zh: "最后更新：2025 年 1 月",
        }}
      >
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-zinc-300 mb-4">
              By accessing or using LitStatus (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-zinc-300 mb-4">
              LitStatus is an AI-powered caption generation service that helps users create captions and hashtags for social media content. The Service is provided &quot;as is&quot; without warranty of any kind.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">3. User Responsibilities</h2>
            <p className="text-zinc-300 mb-4">
              You are responsible for all content you generate using our Service. You agree to:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>Use the Service only for lawful purposes</li>
              <li>Not generate content that is illegal, harmful, or violates third-party rights</li>
              <li>Not attempt to circumvent usage limits or quotas</li>
              <li>Not share your account credentials with others</li>
              <li>Take responsibility for all published content created with our Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">4. Intellectual Property</h2>
            <p className="text-zinc-300 mb-4">
              <strong>Generated Content:</strong> You own all captions and content generated through our Service. You may use them for personal or commercial purposes without restriction.
            </p>
            <p className="text-zinc-300 mb-4">
              <strong>Service IP:</strong> The LitStatus platform, technology, and brand remain our exclusive property. You may not copy, modify, or distribute our software.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">5. Privacy and Data</h2>
            <p className="text-zinc-300 mb-4">
              Your privacy is important to us. Please review our Privacy Policy to understand how we handle your data. Key points:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>Your inputs are processed per request and not stored on our servers</li>
              <li>We do not sell your personal information to third parties</li>
              <li>We use cookies for essential functionality and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">6. Service Availability and Quotas</h2>
            <p className="text-zinc-300 mb-4">
              We offer different access tiers with varying quotas:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>Guest:</strong> 3 generations per day</li>
              <li><strong>User (Free):</strong> 20 generations per day</li>
              <li><strong>Pro:</strong> Unlimited generations (coming soon)</li>
            </ul>
            <p className="text-zinc-300 mb-4">
              Quotas reset daily at 00:00 UTC. We reserve the right to modify quotas at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">7. Disclaimers</h2>
            <p className="text-zinc-300 mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>Accuracy or reliability of generated content</li>
              <li>Availability or uninterrupted operation</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement of third-party rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-zinc-300 mb-4">
              To the fullest extent permitted by law, LitStatus shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the Service. Our total liability shall not exceed the amount you paid, if any, for using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">9. Termination</h2>
            <p className="text-zinc-300 mb-4">
              We reserve the right to suspend or terminate your access to the Service at any time, with or without cause, with or without notice. You may also stop using the Service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">10. Changes to Terms</h2>
            <p className="text-zinc-300 mb-4">
              We may update these Terms from time to time. We will notify users of significant changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">11. Governing Law</h2>
            <p className="text-zinc-300 mb-4">
              These Terms are governed by the laws of the jurisdiction in which LitStatus is established. Any disputes shall be resolved in accordance with applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p className="text-zinc-300 mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-zinc-300">
              <a href="mailto:support@litstatus.com" className="text-white underline hover:text-zinc-300">
                support@litstatus.com
              </a>
            </p>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
