import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildContentMetadata, getBreadcrumbItemsForPath } from "@/lib/seo";
import { localizePath } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export const metadata: Metadata = buildContentMetadata({
  title: "Privacy Policy — LitStatus",
  description: "Learn how LitStatus protects your privacy. We don't store your content, we don't sell your data, and we're fully GDPR compliant.",
  path: "/privacy-policy",
  lang: "en",
  keywords: [
    "privacy policy",
    "data protection",
    "gdpr compliant",
    "user privacy",
    "cookie policy",
    "data security",
  ],
  ogTitle: "Privacy Policy — LitStatus",
  ogDescription: "Your privacy matters. Learn how LitStatus handles your data securely.",
  ogImageAlt: "LitStatus Privacy Policy page",
});

export default function PrivacyPolicyPage() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItemsForPath(
      "/privacy-policy",
      "Privacy Policy",
      "en",
    ),
  });

  return (
    <>
      <Script
        id="breadcrumbs-privacy-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MarketingShell
        lang="en"
        title={{ en: "Privacy Policy", zh: "隐私政策" }}
        subtitle={{
          en: "Last updated: January 2025",
          zh: "最后更新：2025 年 1 月",
        }}
      >
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">1. Our Privacy Commitment</h2>
            <p className="text-zinc-300 mb-4">
              At LitStatus, we believe privacy is a fundamental right. This Privacy Policy explains how we handle your information. Simply put: <strong>we don't store your content, and we don't sell your data.</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-white mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Email address (optional, for registered users)</li>
              <li><strong>Input Data:</strong> Text and images you submit for caption generation</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Number of generations, tone modes used</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
              <li><strong>Analytics Data:</strong> Pages visited, time spent, referral source</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>Service Delivery:</strong> Process your caption generation requests</li>
              <li><strong>Quota Management:</strong> Track daily generation limits</li>
              <li><strong>Service Improvement:</strong> Analyze usage patterns to improve AI quality</li>
              <li><strong>Security:</strong> Detect and prevent abuse or fraud</li>
              <li><strong>Communication:</strong> Send service updates (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">4. Content Processing and Storage</h2>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-4">
              <p className="text-zinc-200 font-semibold mb-2">Key Promise: Your Content is Not Stored</p>
              <p className="text-zinc-300">
                We process your text and images to generate captions, then immediately discard them. Your inputs are <strong>never saved to our servers</strong> and are <strong>never used for training</strong> without explicit consent.
              </p>
            </div>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>Inputs are processed per request and not retained</li>
              <li>No personal content is stored on our servers</li>
              <li>Generated outputs belong to you exclusively</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">5. Cookies and Tracking</h2>
            <p className="text-zinc-300 mb-4">
              We use the following types of cookies:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for site functionality (language preference, authentication)</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site (Plausible, privacy-focused)</li>
            </ul>
            <p className="text-zinc-300 mb-4">
              You can manage cookie preferences through our cookie consent banner or your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">6. Third-Party Services</h2>
            <p className="text-zinc-300 mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>OpenAI API:</strong> Powers our AI caption generation</li>
              <li><strong>Supabase:</strong> Secure database for user accounts</li>
              <li><strong>Plausible:</strong> Privacy-focused analytics (no cookies by default)</li>
              <li><strong>Google Analytics:</strong> Optional, with anonymization enabled</li>
            </ul>
            <p className="text-zinc-300">
              All third parties are contractually bound to protect your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">7. Data Retention</h2>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>User Inputs:</strong> Not retained after processing</li>
              <li><strong>Account Data:</strong> Retained until account deletion</li>
              <li><strong>Analytics Data:</strong> Retained for 14 days (Plausible) or 26 months (Google Analytics, if enabled)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">8. Your GDPR Rights</h2>
            <p className="text-zinc-300 mb-4">
              Under GDPR, you have the following rights:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
              <li><strong>Right to Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Right to Object:</strong> Object to processing of your data</li>
              <li><strong>Right to Restrict:</strong> Limit how we use your data</li>
            </ul>
            <p className="text-zinc-300">
              To exercise these rights, contact us at <a href="mailto:privacy@litstatus.com" className="text-white underline hover:text-zinc-300">privacy@litstatus.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">9. Data Security</h2>
            <p className="text-zinc-300 mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>HTTPS/TLS encryption for all data transmission</li>
              <li>Secure password hashing</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-zinc-300 mb-4">
              Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take steps to delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">11. International Data Transfers</h2>
            <p className="text-zinc-300 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with GDPR requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">12. Changes to This Policy</h2>
            <p className="text-zinc-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify users of significant changes via email or in-app notification. Changes take effect 30 days after posting.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">13. Contact Information</h2>
            <p className="text-zinc-300 mb-4">
              For privacy-related inquiries or to exercise your GDPR rights, contact us at:
            </p>
            <p className="text-zinc-300 mb-2">
              <strong>Email:</strong> <a href="mailto:privacy@litstatus.com" className="text-white underline hover:text-zinc-300">privacy@litstatus.com</a>
            </p>
            <p className="text-zinc-300">
              <strong>Data Protection Officer:</strong> Available upon request for GDPR-related matters.
            </p>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
