import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { getAlternatePaths, getLangTag, localizePath } from "@/lib/i18n";

export type PageKey =
  | "home"
  | "examples"
  | "pricing"
  | "faq"
  | "login"
  | "use-cases"
  | "case-studies"
  | "privacy-policy"
  | "terms-of-service";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

const PAGE_PATHS: Record<PageKey, string> = {
  home: "/",
  examples: "/examples",
  pricing: "/pricing",
  faq: "/faq",
  login: "/login",
  "use-cases": "/use-cases",
  "case-studies": "/case-studies",
  "privacy-policy": "/privacy-policy",
  "terms-of-service": "/terms-of-service",
};

const BREADCRUMB_LABELS: Record<Lang, Record<PageKey, string>> = {
  en: {
    home: "Home",
    examples: "Examples",
    pricing: "Plans",
    faq: "FAQ",
    login: "Sign In",
    "use-cases": "Use Cases",
    "case-studies": "Case Studies",
    "privacy-policy": "Privacy Policy",
    "terms-of-service": "Terms of Service",
  },
  zh: {
    home: "首页",
    examples: "文案示例",
    pricing: "方案定价",
    faq: "常见问题",
    login: "登录",
    "use-cases": "使用场景",
    "case-studies": "案例研究",
    "privacy-policy": "隐私政策",
    "terms-of-service": "服务条款",
  },
};

const BASE_KEYWORDS = {
  en: [
    "ai caption generator",
    "instagram captions",
    "tiktok captions",
    "instagram caption generator",
    "tiktok caption generator",
    "social media caption generator",
    "hashtag generator",
    "social media captions",
    "caption writer",
    "viral captions",
    "ai caption tool",
    "content creator tools",
    "caption templates",
    "social media post generator",
    "instagram hook generator",
    "tiktok hook generator",
  ],
  zh: [
    "文案生成器",
    "AI 文案生成器",
    "小红书文案",
    "抖音文案",
    "Instagram 文案",
    "TikTok 文案",
    "短视频文案",
    "社媒文案生成",
    "AI 文案工具",
    "标签生成",
    "社媒文案",
    "内容创作工具",
    "文案模板",
    "社交媒体文案",
    "爆款文案生成",
  ],
} as const;

const SEO_COPY: Record<Lang, Record<PageKey, {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImageAlt?: string;
}>> = {
  en: {
    home: {
      title: "LitStatus — AI Caption Generator for Instagram & TikTok",
      description:
        "Generate viral captions and hashtags in seconds. Choose from Standard, Savage, or Rizz tone modes. Text or image input. Free daily quota available.",
      ogTitle: "LitStatus — AI Caption Generator for Creators",
      ogDescription:
        "Create engaging captions and hashtags instantly with three AI tone modes. Perfect for Instagram, TikTok, and more.",
      ogImageAlt: "LitStatus AI caption generator interface showing tone selection",
    },
    examples: {
      title: "Caption Examples — Real AI Generated Outputs",
      description:
        "Explore real LitStatus outputs across Standard, Savage, and Rizz tone modes with curated hashtags for Instagram and TikTok.",
      keywords: [
        "caption examples",
        "ai caption examples",
        "rizz captions",
        "savage captions",
        "instagram caption examples",
        "tiktok caption examples",
        "caption templates",
      ],
      ogTitle: "AI Caption Examples — LitStatus",
      ogDescription:
        "See real AI-generated caption outputs across all three tone modes with hashtags.",
      ogImageAlt: "LitStatus caption examples showing different tone modes",
    },
    pricing: {
      title: "Plans & Pricing — Free and Pro Access",
      description:
        "Compare Guest, User, and Pro access tiers. Learn about daily quotas, features, and benefits available at each level.",
      keywords: [
        "caption generator pricing",
        "free caption tool",
        "pro caption generator",
        "caption quotas",
        "ai caption cost",
      ],
      ogTitle: "Plans & Access — LitStatus",
      ogDescription:
        "Compare access tiers, daily quotas, and feature availability for free and Pro plans.",
      ogImageAlt: "LitStatus pricing and access tiers comparison",
    },
    faq: {
      title: "FAQ — LitStatus AI Caption Generator",
      description:
        "Find answers to common questions about daily quotas, privacy policy, tone modes, language support, commercial use, and Pro features.",
      keywords: [
        "caption generator faq",
        "caption quota explained",
        "caption privacy policy",
        "ai caption questions",
      ],
      ogTitle: "Frequently Asked Questions — LitStatus",
      ogDescription:
        "Get answers about quotas, privacy settings, tone modes, and Pro feature availability.",
      ogImageAlt: "LitStatus FAQ section",
    },
    login: {
      title: "Sign In — LitStatus",
      description:
        "Log in to your account to unlock higher daily quotas, save caption history, and access Pro waitlist features.",
      ogTitle: "Sign In to LitStatus",
      ogDescription:
        "Access your account to unlock increased daily quotas and save your caption generation history.",
      ogImageAlt: "LitStatus sign in page",
    },
    "use-cases": {
      title: "Use Cases — Instagram, TikTok, and Xiaohongshu",
      description:
        "Platform-specific caption strategies for Instagram, TikTok, and Xiaohongshu. Learn hooks, tone techniques, and hashtag tactics that feel native to each platform.",
      keywords: [
        "instagram captions",
        "tiktok captions",
        "xiaohongshu captions",
        "platform caption strategy",
        "social media hooks",
      ],
      ogTitle: "Platform Use Cases — LitStatus",
      ogDescription:
        "Platform-specific caption playbooks for Instagram, TikTok, and Xiaohongshu with native hooks and hashtags.",
      ogImageAlt: "LitStatus use cases for different social platforms",
    },
    "case-studies": {
      title: "Case Studies — Content Strategy Playbooks",
      description:
        "In-depth case studies showing how creators and brands plan and execute caption strategies across multiple social platforms.",
      keywords: [
        "caption strategy playbook",
        "content workflow examples",
        "social media case study",
        "creator case study",
      ],
      ogTitle: "Case Studies — LitStatus",
      ogDescription:
        "Long-form caption workflows and strategies from successful creators and brands.",
      ogImageAlt: "LitStatus case studies and playbooks",
    },
    "privacy-policy": {
      title: "Privacy Policy — LitStatus",
      description:
        "Learn how LitStatus protects your privacy. We don't store your content, we don't sell your data, and we're fully GDPR compliant.",
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
    },
    "terms-of-service": {
      title: "Terms of Service — LitStatus",
      description:
        "Read our Terms of Service to understand the rules and guidelines for using LitStatus AI caption generator. Your rights, responsibilities, and service limitations.",
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
    },
  },
  zh: {
    home: {
      title: "LitStatus — AI 文案生成器（Instagram / TikTok）",
      description:
        "秒级生成高传播文案与标签。支持 Standard、Savage、Rizz 三种语气模式。文字或图片输入。每日免费额度可用。",
      ogTitle: "LitStatus — 专为创作者打造的 AI 文案生成器",
      ogDescription:
        "三种 AI 语气模式，即时生成吸引人的文案与标签。完美适配 Instagram、TikTok 等平台。",
      ogImageAlt: "LitStatus AI 文案生成器界面展示语气选择功能",
    },
    examples: {
      title: "文案示例 — 真实 AI 生成输出",
      description:
        "浏览 LitStatus 在 Standard、Savage、Rizz 三种语气模式下的真实文案输出，以及适配 Instagram 和 TikTok 的精选标签。",
      keywords: [
        "文案示例",
        "AI 文案示例",
        "短视频文案",
        "小红书文案",
        "文案模板",
      ],
      ogTitle: "AI 文案示例 — LitStatus",
      ogDescription: "查看三种语气模式下真实生成的 AI 文案与标签效果。",
      ogImageAlt: "LitStatus 文案示例展示不同语气模式",
    },
    pricing: {
      title: "方案与定价 — 免费与 Pro 权限",
      description:
        "对比访客、用户和 Pro 三种权限等级。了解每日配额、功能权益以及各等级可享受的福利。",
      keywords: [
        "文案生成器 定价",
        "免费文案工具",
        "Pro 文案生成器",
        "配额说明",
        "AI 文案价格",
      ],
      ogTitle: "方案与权限 — LitStatus",
      ogDescription: "对比不同权限等级、每日配额以及免费版和 Pro 版的功能差异。",
      ogImageAlt: "LitStatus 定价与权限等级对比",
    },
    faq: {
      title: "常见问题 — LitStatus AI 文案生成器",
      description:
        "查找关于每日配额、隐私政策、语气模式、语言支持、商业使用以及 Pro 功能的常见问题解答。",
      keywords: [
        "文案生成器 常见问题",
        "配额说明",
        "隐私政策",
        "AI 文案疑问",
      ],
      ogTitle: "常见问题解答 — LitStatus",
      ogDescription: "获取关于配额、隐私设置、语气模式以及 Pro 功能可用性的解答。",
      ogImageAlt: "LitStatus 常见问题专区",
    },
    login: {
      title: "登录 — LitStatus",
      description:
        "登录您的账户以解锁更高的每日配额、保存文案历史记录以及访问 Pro 预约功能。",
      ogTitle: "登录 LitStatus",
      ogDescription: "访问您的账户以解锁增加的每日配额并保存文案生成历史。",
      ogImageAlt: "LitStatus 登录页面",
    },
    "use-cases": {
      title: "使用场景 — Instagram、TikTok 与小红书",
      description:
        "针对 Instagram、TikTok 和小红书的平台专属文案策略。学习让文案在各个平台更具原生感的钩子技巧、语气方法和标签策略。",
      keywords: [
        "Instagram 文案",
        "TikTok 文案",
        "小红书文案",
        "平台文案策略",
        "社媒钩子技巧",
      ],
      ogTitle: "平台使用场景 — LitStatus",
      ogDescription: "Instagram、TikTok、小红书的平台专属文案策略，含原生钩子和标签。",
      ogImageAlt: "LitStatus 不同社交平台的使用场景",
    },
    "case-studies": {
      title: "案例研究 — 内容策略攻略",
      description:
        "深度案例研究，展示创作者和品牌如何在多个社交平台上规划和执行跨平台文案策略。",
      keywords: [
        "文案策略攻略",
        "内容流程示例",
        "社媒案例研究",
        "创作者案例",
      ],
      ogTitle: "案例研究 — LitStatus",
      ogDescription: "成功创作者和品牌的长文案工作流程与策略复盘。",
      ogImageAlt: "LitStatus 案例研究与策略攻略",
    },
    "privacy-policy": {
      title: "隐私政策 — LitStatus",
      description:
        "了解 LitStatus 如何保护您的隐私。我们不存储您的内容，不出售您的数据，并完全符合 GDPR 要求。",
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
    },
    "terms-of-service": {
      title: "服务条款 — LitStatus",
      description:
        "阅读 LitStatus AI 文案生成器的服务条款，了解使用规则与指南。您的权利、责任与服务限制。",
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
    },
  },
};

function absoluteUrl(path: string) {
  const base = SITE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

function getOgImage(lang: Lang) {
  const query = lang === "zh" ? "zh" : "en";
  return `/og?lang=${query}`;
}

export function buildPageMetadata(page: PageKey, lang: Lang): Metadata {
  const copy = SEO_COPY[lang][page];
  const path = PAGE_PATHS[page];
  const canonical = localizePath(path, lang);
  const alternates = getAlternatePaths(path);
  const ogLocale = lang === "zh" ? "zh_CN" : "en_US";
  const ogAlternate = lang === "zh" ? ["en_US"] : ["zh_CN"];
  const robots =
    page === "login" ? { index: false, follow: false } : undefined;
  const ogImage = getOgImage(lang);

  return {
    title: copy.title,
    description: copy.description,
    keywords: [...BASE_KEYWORDS[lang], ...(copy.keywords ?? [])],
    alternates: {
      canonical,
      languages: alternates,
    },
    openGraph: {
      title: copy.ogTitle ?? copy.title,
      description: copy.ogDescription ?? copy.description,
      url: absoluteUrl(canonical),
      type: "website",
      locale: ogLocale,
      alternateLocale: ogAlternate,
      siteName: "LitStatus",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: copy.ogImageAlt ?? copy.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@litstatus",
      creator: "@litstatus",
      title: copy.ogTitle ?? copy.title,
      description: copy.ogDescription ?? copy.description,
      images: [ogImage],
    },
    other: {
      "content-language": getLangTag(lang),
      "article:author": "LitStatus",
      "article:publisher": "LitStatus",
    },
    robots,
  };
}

export function getPagePath(page: PageKey) {
  return PAGE_PATHS[page];
}

export function getBreadcrumbItems(page: PageKey, lang: Lang) {
  const labels = BREADCRUMB_LABELS[lang];
  const items = [
    {
      name: labels.home,
      item: absoluteUrl(localizePath("/", lang)),
    },
  ];

  if (page !== "home") {
    items.push({
      name: labels[page],
      item: absoluteUrl(localizePath(PAGE_PATHS[page], lang)),
    });
  }

  return items;
}

export function buildContentMetadata({
  title,
  description,
  path,
  lang,
  keywords,
  ogTitle,
  ogDescription,
  ogImageAlt,
}: {
  title: string;
  description: string;
  path: string;
  lang: Lang;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImageAlt?: string;
}): Metadata {
  const canonical = localizePath(path, lang);
  const alternates = getAlternatePaths(path);
  const ogLocale = lang === "zh" ? "zh_CN" : "en_US";
  const ogAlternate = lang === "zh" ? ["en_US"] : ["zh_CN"];
  const ogImage = getOgImage(lang);

  return {
    title,
    description,
    keywords: [...BASE_KEYWORDS[lang], ...(keywords ?? [])],
    alternates: {
      canonical,
      languages: alternates,
    },
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      url: absoluteUrl(canonical),
      type: "article",
      locale: ogLocale,
      alternateLocale: ogAlternate,
      siteName: "LitStatus",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogImageAlt ?? title,
        },
      ],
      publishedTime: new Date().toISOString(),
      authors: ["LitStatus"],
    },
    twitter: {
      card: "summary_large_image",
      site: "@litstatus",
      creator: "@litstatus",
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      images: [ogImage],
    },
    other: {
      "content-language": getLangTag(lang),
      "article:author": "LitStatus",
      "article:publisher": "LitStatus",
      "article:section": "Social Media",
    },
  };
}

export function getBreadcrumbItemsForPath(
  path: string,
  label: string,
  lang: Lang,
) {
  const items = [
    {
      name: BREADCRUMB_LABELS[lang].home,
      item: absoluteUrl(localizePath("/", lang)),
    },
  ];
  if (path !== "/") {
    items.push({
      name: label,
      item: absoluteUrl(localizePath(path, lang)),
    });
  }
  return items;
}
