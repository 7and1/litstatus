import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildContentMetadata, getBreadcrumbItemsForPath } from "@/lib/seo";
import { localizePath } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export const metadata: Metadata = buildContentMetadata({
  title: "隐私政策 — LitStatus",
  description: "了解 LitStatus 如何保护您的隐私。我们不存储您的内容，不出售您的数据，并完全符合 GDPR 要求。",
  path: "/privacy-policy",
  lang: "zh",
  keywords: [
    "隐私政策",
    "数据保护",
    "GDPR 合规",
    "用户隐私",
    "Cookie 政策",
    "数据安全",
  ],
  ogTitle: "隐私政策 — LitStatus",
  ogDescription: "您的隐私很重要。了解 LitStatus 如何安全处理您的数据。",
  ogImageAlt: "LitStatus 隐私政策页面",
});

export default function PrivacyPolicyPageZh() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItemsForPath(
      "/privacy-policy",
      "隐私政策",
      "zh",
    ),
  });

  return (
    <>
      <Script
        id="breadcrumbs-privacy-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MarketingShell
        lang="zh"
        title={{ en: "Privacy Policy", zh: "隐私政策" }}
        subtitle={{
          en: "Last updated: January 2025",
          zh: "最后更新：2025 年 1 月",
        }}
      >
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">1. 我们的隐私承诺</h2>
            <p className="text-zinc-300 mb-4">
              在 LitStatus，我们相信隐私是一项基本权利。本隐私政策解释我们如何处理您的信息。简单来说：<strong>我们不存储您的内容，不出售您的数据。</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">2. 我们收集的信息</h2>

            <h3 className="text-lg font-medium text-white mb-3 mt-6">2.1 您提供的信息</h3>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>账户信息：</strong>邮箱地址（可选，注册用户需要）</li>
              <li><strong>输入数据：</strong>您提交用于生成文案的文字和图片</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-3 mt-6">2.2 自动收集的信息</h3>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>使用数据：</strong>生成次数、使用的语气模式</li>
              <li><strong>技术数据：</strong>IP 地址、浏览器类型、设备信息</li>
              <li><strong>分析数据：</strong>访问页面、停留时间、来源</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">3. 我们如何使用您的信息</h2>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>服务交付：</strong>处理您的文案生成请求</li>
              <li><strong>配额管理：</strong>跟踪每日生成限制</li>
              <li><strong>服务改进：</strong>分析使用模式以提升 AI 质量</li>
              <li><strong>安全防护：</strong>检测和防止滥用或欺诈</li>
              <li><strong>沟通通知：</strong>发送服务更新（需您同意）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">4. 内容处理与存储</h2>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-4">
              <p className="text-zinc-200 font-semibold mb-2">核心承诺：您的内容不被存储</p>
              <p className="text-zinc-300">
                我们处理您的文字和图片以生成文案，然后立即丢弃。您的输入<strong>绝不会保存到我们的服务器</strong>，也<strong>绝不会在未经明确同意的情况下用于训练</strong>。
              </p>
            </div>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>输入按次处理，不会保留</li>
              <li>个人内容不存储在我们的服务器上</li>
              <li>生成的输出完全归您所有</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">5. Cookie 与跟踪</h2>
            <p className="text-zinc-300 mb-4">
              我们使用以下类型的 cookie：
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>必要 Cookie：</strong>网站功能所需（语言偏好、身份验证）</li>
              <li><strong>分析 Cookie：</strong>帮助我们了解访客如何使用网站（Plausible，注重隐私）</li>
            </ul>
            <p className="text-zinc-300 mb-4">
              您可以通过我们的 cookie 同意横幅或浏览器设置管理 cookie 偏好。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">6. 第三方服务</h2>
            <p className="text-zinc-300 mb-4">
              我们使用以下第三方服务：
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>OpenAI API：</strong>为我们的 AI 文案生成提供支持</li>
              <li><strong>Supabase：</strong>用户账户的安全数据库</li>
              <li><strong>Plausible：</strong>注重隐私的分析（默认无 cookie）</li>
              <li><strong>Google Analytics：</strong>可选，已启用匿名化</li>
            </ul>
            <p className="text-zinc-300">
              所有第三方均受合同约束保护您的数据。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">7. 数据保留</h2>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>用户输入：</strong>处理后不保留</li>
              <li><strong>账户数据：</strong>保留至账户删除</li>
              <li><strong>分析数据：</strong>保留 14 天（Plausible）或 26 个月（Google Analytics，如启用）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">8. 您的 GDPR 权利</h2>
            <p className="text-zinc-300 mb-4">
              根据 GDPR，您拥有以下权利：
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>访问权：</strong>请求您的个人数据副本</li>
              <li><strong>更正权：</strong>更正不准确的资料</li>
              <li><strong>删除权：</strong>请求删除您的数据</li>
              <li><strong>可携带权：</strong>以结构化格式接收您的数据</li>
              <li><strong>反对权：</strong>反对处理您的数据</li>
              <li><strong>限制权：</strong>限制我们使用您数据的方式</li>
            </ul>
            <p className="text-zinc-300">
              如需行使这些权利，请联系 <a href="mailto:privacy@litstatus.com" className="text-white underline hover:text-zinc-300">privacy@litstatus.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">9. 数据安全</h2>
            <p className="text-zinc-300 mb-4">
              我们实施行业标准的安全措施：
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>所有数据传输采用 HTTPS/TLS 加密</li>
              <li>安全的密码哈希</li>
              <li>定期安全审计</li>
              <li>访问控制和身份验证要求</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">10. 儿童隐私</h2>
            <p className="text-zinc-300 mb-4">
              我们的服务不面向 13 岁以下儿童。我们不会故意收集 13 岁以下儿童的个人信息。如发现此类收集，我们将采取措施删除。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">11. 国际数据传输</h2>
            <p className="text-zinc-300 mb-4">
              您的信息可能会传输到您所在国家/地区以外的地区进行处理。我们确保采取适当保障措施，根据 GDPR 要求保护您的数据。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">12. 政策变更</h2>
            <p className="text-zinc-300 mb-4">
              我们可能会不时更新本隐私政策。我们将通过邮件或应用内通知向用户告知重大变更。变更发布后 30 天生效。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">13. 联系方式</h2>
            <p className="text-zinc-300 mb-4">
              如有隐私相关咨询或行使 GDPR 权利，请联系：
            </p>
            <p className="text-zinc-300 mb-2">
              <strong>邮箱：</strong> <a href="mailto:privacy@litstatus.com" className="text-white underline hover:text-zinc-300">privacy@litstatus.com</a>
            </p>
            <p className="text-zinc-300">
              <strong>数据保护官：</strong>如有 GDPR 相关事宜，可应要求提供。
            </p>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
