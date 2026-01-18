import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { buildContentMetadata, getBreadcrumbItemsForPath } from "@/lib/seo";
import { localizePath } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

export const metadata: Metadata = buildContentMetadata({
  title: "服务条款 — LitStatus",
  description: "阅读 LitStatus AI 文案生成器的服务条款，了解使用规则与指南。您的权利、责任与服务限制。",
  path: "/terms-of-service",
  lang: "zh",
  keywords: [
    "服务条款",
    "使用条款",
    "用户协议",
    "法律条款",
    "服务规则",
  ],
  ogTitle: "服务条款 — LitStatus",
  ogDescription: "使用 LitStatus AI 文案生成器的条款与条件。",
  ogImageAlt: "LitStatus 服务条款页面",
});

export default function TermsOfServicePageZh() {
  const breadcrumbSchema = BreadcrumbSchema({
    items: getBreadcrumbItemsForPath(
      "/terms-of-service",
      "服务条款",
      "zh",
    ),
  });

  return (
    <>
      <Script
        id="breadcrumbs-terms-zh"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MarketingShell
        lang="zh"
        title={{ en: "Terms of Service", zh: "服务条款" }}
        subtitle={{
          en: "Last updated: January 2025",
          zh: "最后更新：2025 年 1 月",
        }}
      >
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">1. 接受条款</h2>
            <p className="text-zinc-300 mb-4">
              访问或使用 LitStatus（"服务"）即表示您同意受本服务条款（"条款"）约束。若您不同意本条款，请勿使用我们的服务。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">2. 服务描述</h2>
            <p className="text-zinc-300 mb-4">
              LitStatus 是一款 AI 驱动的文案生成服务，帮助用户为社媒内容创建文案与标签。本服务按"现状"提供，不提供任何形式的担保。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">3. 用户责任</h2>
            <p className="text-zinc-300 mb-4">
              您对使用本服务生成的所有内容负责。您同意：
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>仅将服务用于合法目的</li>
              <li>不生成非法、有害或侵犯第三方权利的内容</li>
              <li>不尝试规避使用限额或配额</li>
              <li>不与他人共享您的账户凭据</li>
              <li>承担使用本服务创建的所有已发布内容的责任</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">4. 知识产权</h2>
            <p className="text-zinc-300 mb-4">
              <strong>生成内容：</strong>您拥有通过本服务生成的所有文案和内容。您可以为个人或商业目的自由使用，不受限制。
            </p>
            <p className="text-zinc-300 mb-4">
              <strong>服务知识产权：</strong>LitStatus 平台、技术和品牌归我们专有。您不得复制、修改或分发我们的软件。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">5. 隐私与数据</h2>
            <p className="text-zinc-300 mb-4">
              您的隐私对我们很重要。请查看我们的隐私政策以了解我们如何处理您的数据。要点如下：
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>您的内容按次处理，不会存储在我们的服务器上</li>
              <li>我们不会将您的个人信息出售给第三方</li>
              <li>我们使用 cookie 进行必要功能和分析</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">6. 服务可用性与配额</h2>
            <p className="text-zinc-300 mb-4">
              我们提供不同配额的访问等级：
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li><strong>访客：</strong>每日 3 次生成</li>
              <li><strong>用户（免费）：</strong>每日 20 次生成</li>
              <li><strong>Pro：</strong>无限生成（即将推出）</li>
            </ul>
            <p className="text-zinc-300 mb-4">
              配额于 UTC 00:00 每日重置。我们保留随时修改配额的权利。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">7. 免责声明</h2>
            <p className="text-zinc-300 mb-4">
              本服务按"现状"提供，不提供任何明示或暗示的担保。我们免除所有担保，包括但不限于：
            </p>
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
              <li>生成内容的准确性或可靠性</li>
              <li>服务可用性或不中断运行</li>
              <li>对特定用途的适用性</li>
              <li>不侵犯第三方权利</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">8. 责任限制</h2>
            <p className="text-zinc-300 mb-4">
              在法律允许的最大范围内，LitStatus 对因您使用服务而产生的任何间接、附带、特殊或后果性损害不承担责任。我们的总责任不超过您使用服务所支付的金额（如有）。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">9. 终止</h2>
            <p className="text-zinc-300 mb-4">
              我们保留随时暂停或终止您访问服务的权利，无论是否有原因，无论是否通知。您也可以随时停止使用服务。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">10. 条款变更</h2>
            <p className="text-zinc-300 mb-4">
              我们可能会不时更新这些条款。我们将通过邮件或应用内通知向用户告知重大变更。变更后继续使用服务即表示接受新条款。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">11. 适用法律</h2>
            <p className="text-zinc-300 mb-4">
              本条款受 LitStatus 所在地司法管辖区的法律管辖。任何争议应根据适用法律解决。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">12. 联系我们</h2>
            <p className="text-zinc-300 mb-4">
              如您对本条款有疑问，请联系：
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
