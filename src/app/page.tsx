"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { MODES, type Mode, type QuotaStatus } from "@/lib/constants";
import { loadLang, saveLang, type Lang } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";
import { useABVariant } from "@/lib/ab";
import {
  COMMUNITY,
  DEMO_VARIANTS,
  EXAMPLES,
  FEATURES,
  FAQS,
  HERO_BULLETS,
  HERO_CTA,
  HERO_VARIANTS,
  STEPS,
  STATS,
  TIERS,
  pick,
} from "@/lib/content";

// Local Session type for browser client compatibility
type Session = {
  access_token: string;
  user: {
    id: string;
    email?: string;
  };
};

type ToastState = {
  show: boolean;
  message: string;
  type: "success" | "error";
};

type GenerateResult = {
  caption: string;
  hashtags: string;
  detected_object: string | null;
  affiliate_category: string | null;
  affiliate: { text: { en: string; zh: string }; link: string } | null;
  quota: QuotaStatus;
};

type HistoryItem = {
  id: string;
  caption: string;
  hashtags: string;
  mode: Mode;
  createdAt: number;
};

const HISTORY_KEY = "litstatus_history";

const COPY = {
  en: {
    headerBrand: "LitStatus",
    headerDomain: "litstatus.com",
    login: "Log in",
    logout: "Log out",
    quotaUnlimited: "Unlimited",
    badgePro: "Pro unlocked",
    badgeStandard: "Standard mode",
    modeHint: "Pick a tone and generate.",
    placeholder: "Example: Just posted my AJ1s and need a savage caption...",
    uploadLabel: "Upload image (Pro Vision)",
    uploadHint: "Vision is available for Pro only.",
    uploadSelected: "Selected:",
    generate: "Generate",
    generating: "Generating...",
    regenerate: "Regenerate",
    copy: "Copy",
    copyAll: "Copy caption + hashtags",
    copied: "Copied!",
    resultsTitle: "Results",
    resultsDesc: "Caption, hashtags, and detected object.",
    hashtags: "Hashtags",
    detected: "Detected",
    detectedNone: "No specific object detected",
    affiliateCta: "Open Amazon recommendation →",
    emptyState: "Nothing yet. Start on the left.",
    historyTitle: "Recent generations",
    historyEmpty: "No history yet.",
    wishTitle: "Pro Wish List",
    wishDesc: "Pro features are ready. Join the list to get notified.",
    wishPlaceholder: "Email for updates",
    wishButton: "Join Wish List",
    wishSuccess: "You are in. We will notify you.",
    wishError: "Submission failed.",
    railTitle: "Your access",
    railSubtitle: "Live quota and status.",
    adBanner: "Ad banner slot: brand placement / affiliate / CPM",
    langToggle: "EN / 中文",
    langLabel: "Language",
    feedbackTitle: "Was this good?",
    feedbackThanks: "Thanks for the feedback.",
    privacy: "We do not store your inputs. Generation happens per request.",
    close: "Close",
    imageRemove: "Remove image",
  },
  zh: {
    headerBrand: "LitStatus",
    headerDomain: "litstatus.com",
    login: "登录",
    logout: "退出",
    quotaUnlimited: "无限",
    badgePro: "Pro 全解锁",
    badgeStandard: "Standard 模式",
    modeHint: "选择语气，直接生成。",
    placeholder: "例如：刚晒完球鞋，想要一句超狠的朋友圈文案...",
    uploadLabel: "上传图片 (Pro Vision)",
    uploadHint: "识图功能仅对 Pro 开放。",
    uploadSelected: "已选择：",
    generate: "生成",
    generating: "生成中...",
    regenerate: "再来一条",
    copy: "一键复制",
    copyAll: "复制文案 + 标签",
    copied: "已复制！",
    resultsTitle: "生成结果",
    resultsDesc: "自动输出文案、标签、识别物体。",
    hashtags: "标签",
    detected: "检测到",
    detectedNone: "未检测到具体物体",
    affiliateCta: "打开 Amazon 推荐 →",
    emptyState: "还没有生成内容，先在左侧输入。",
    historyTitle: "最近生成",
    historyEmpty: "暂无历史记录。",
    wishTitle: "Pro Wish List",
    wishDesc: "付费功能已开发，就差开通订阅。加入列表优先获取。",
    wishPlaceholder: "你希望通知的邮箱",
    wishButton: "加入 Wish List",
    wishSuccess: "已加入，我们会通知你。",
    wishError: "提交失败。",
    railTitle: "当前权限",
    railSubtitle: "实时配额与状态。",
    adBanner: "广告 Banner 位：可接入品牌合作 / 推荐位 / CPM 广告条",
    langToggle: "EN / 中文",
    langLabel: "语言",
    feedbackTitle: "这条好用吗？",
    feedbackThanks: "感谢反馈。",
    privacy: "我们不会保存输入内容，每次请求独立生成。",
    close: "关闭",
    imageRemove: "移除图片",
  },
} as const;

const PLAN_LABELS = {
  en: { guest: "Guest", user: "User", pro: "Pro" },
  zh: { guest: "访客", user: "用户", pro: "Pro" },
} as const;

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<Mode>("Standard");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [wishEmail, setWishEmail] = useState("");
  const [wishStatus, setWishStatus] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>(() => loadLang());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const generatorRef = useRef<HTMLDivElement>(null);
  const heroVariant = useABVariant("hero_demo_v1");

  // Toast notification
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    },
    [],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !loading) {
        e.preventDefault();
        document.getElementById("generate-btn")?.click();
      }
      // Escape to clear error
      if (e.key === "Escape" && error) {
        setError(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, error]);

  useEffect(() => {
    saveLang(lang);
  }, [lang]);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: listener } = supabaseBrowser.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryItem[];
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history.slice(0, 3)),
    );
  }, [history]);

  const authHeader = useMemo<HeadersInit | undefined>(() => {
    if (!session?.access_token) return undefined;
    return { Authorization: `Bearer ${session.access_token}` };
  }, [session]);

  const t = COPY[lang];
  const isPro = quota?.isPro ?? false;
  const heroCopy = HERO_VARIANTS[heroVariant];
  const demoExample = DEMO_VARIANTS[heroVariant];

  const planLabel = quota?.plan
    ? PLAN_LABELS[lang][quota.plan]
    : PLAN_LABELS[lang].guest;

  const quotaLabel = quota
    ? quota.isPro
      ? t.quotaUnlimited
      : `${quota.remaining ?? 0} / ${quota.limit ?? 0}`
    : "-";

  const fetchQuota = async () => {
    const response = await fetch("/api/quota", {
      headers: authHeader,
    });
    if (!response.ok) return;
    const data = await response.json();
    if (data.quota) {
      setQuota(data.quota as QuotaStatus);
    }
  };

  useEffect(() => {
    fetchQuota();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (!isPro && mode !== "Standard") {
      setMode("Standard");
    }
    if (!isPro && imageFile) {
      setImageFile(null);
    }
  }, [isPro, mode, imageFile]);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    setFeedbackRating(null);
    trackEvent("cta_generate_click", { variant: heroVariant, lang });

    const formData = new FormData();
    if (text.trim()) formData.append("text", text.trim());
    formData.append("mode", mode);
    formData.append("lang", lang);

    if (imageFile && isPro) {
      formData.append("image", imageFile);
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: authHeader,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Something went wrong.");
      if (data.quota) setQuota(data.quota as QuotaStatus);
      setLoading(false);
      trackEvent("generate_error", {
        variant: heroVariant,
        lang,
        mode,
      });
      return;
    }

    setResult(data as GenerateResult);
    if (data.quota) setQuota(data.quota as QuotaStatus);
    setLoading(false);
    trackEvent("generate_success", {
      variant: heroVariant,
      lang,
      mode,
      has_image: imageFile ? true : false,
    });

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      caption: data.caption ?? "",
      hashtags: data.hashtags ?? "",
      mode,
      createdAt: Date.now(),
    };

    setHistory((prev) => [newItem, ...prev].slice(0, 3));
  };

  const handleCopy = async () => {
    if (!result?.caption) return;
    try {
      await navigator.clipboard.writeText(result.caption);
      showToast(t.copied, "success");
      setCopiedIndex(0);
      setTimeout(() => setCopiedIndex(null), 1500);
      trackEvent("copy_caption", { variant: heroVariant, lang, mode });
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const handleCopyAll = async () => {
    if (!result) return;
    const combined = `${result.caption}\n${result.hashtags}`.trim();
    if (!combined) return;
    try {
      await navigator.clipboard.writeText(combined);
      showToast(t.copied, "success");
      setCopiedIndex(1);
      setTimeout(() => setCopiedIndex(null), 1500);
      trackEvent("copy_all", { variant: heroVariant, lang, mode });
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    const fileInput = document.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }, []);

  const handleHistoryItemClick = useCallback((item: HistoryItem) => {
    setText(item.caption);
    setMode(item.mode);
    generatorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    setSession(null);
  };

  const handleWishlist = async () => {
    setWishStatus(null);
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(authHeader ?? {}) },
      body: JSON.stringify({
        email: session?.user.email ? undefined : wishEmail,
        note: "Pro waitlist",
        lang,
        variant: heroVariant,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setWishStatus(data.error ?? t.wishError);
      return;
    }

    setWishStatus(t.wishSuccess);
    setWishEmail("");
    trackEvent("wish_submit", { variant: heroVariant, lang });
  };

  const handleFeedback = async (rating: 1 | -1) => {
    if (!result) return;
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(authHeader ?? {}) },
      body: JSON.stringify({
        rating,
        mode,
        caption: result.caption,
        hashtags: result.hashtags,
        detected_object: result.detected_object,
        lang,
        variant: heroVariant,
      }),
    });

    if (response.ok) {
      setFeedbackRating(rating);
      trackEvent(rating === 1 ? "feedback_up" : "feedback_down", {
        variant: heroVariant,
        lang,
        mode,
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b0f] text-white">
      {/* JSON-LD Structured Data for WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "LitStatus - AI Caption Generator",
            description:
              "Generate viral captions and hashtags instantly with AI. 3 tone modes: Standard, Savage, Rizz. Supports text and image input. English & Chinese.",
            url: "https://litstatus.com",
            inLanguage: lang === "zh" ? "zh-CN" : "en",
            about: {
              "@type": "SoftwareApplication",
              name: "LitStatus",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web",
            },
            mainEntity: {
              "@type": "SoftwareApplication",
              name: "LitStatus AI Caption Generator",
              applicationCategory: "UtilitiesApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            },
          }),
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(44,238,240,0.35),rgba(11,11,15,0))] blur-3xl" />
        <div className="absolute right-[-10%] top-[20%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(246,183,60,0.35),rgba(11,11,15,0))] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(0,255,140,0.2),rgba(11,11,15,0))] blur-3xl" />
      </div>

      {/* Toast notification */}
      <div
        className={`toast ${toast.show ? "show" : ""} ${toast.type}`}
        role="alert"
        aria-live="polite"
      >
        {toast.message}
      </div>

      <main
        id="main-content"
        className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 sm:gap-14 sm:px-6 sm:py-12 lg:gap-16"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-12 sm:w-12 sm:rounded-2xl">
              <span className="text-base font-display sm:text-lg">LS</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
                {t.headerBrand}
              </p>
              <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  {t.headerDomain}
                </Link>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
              className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-xs"
              aria-label={t.langLabel}
              lang={lang === "zh" ? "zh-CN" : "en"}
            >
              <span className="sr-only">{t.langLabel}</span>
              {t.langToggle}
            </button>
            <div
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-zinc-300 sm:px-4 sm:py-2 sm:text-xs"
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">{t.railTitle}: </span>
              {planLabel} · {quotaLabel}
            </div>
            {session ? (
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-xs"
              >
                {t.logout}
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-4 sm:py-2 sm:text-xs"
              >
                {t.login}
              </Link>
            )}
          </div>
        </header>

        <section
          className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10"
          aria-labelledby="hero-heading"
        >
          <div className="space-y-4 sm:space-y-6">
            <article className="reveal rounded-2xl border border-white/10 bg-black/50 p-5 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.9)] sm:rounded-3xl sm:p-8">
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
                Lit captions engine
              </p>
              <h2
                id="hero-heading"
                className="mt-3 font-display text-2xl font-semibold leading-tight sm:mt-4 sm:text-4xl"
              >
                {pick(lang, heroCopy.title)}
              </h2>
              <p
                className="mt-3 text-sm text-zinc-400 sm:mt-4 sm:text-base"
                itemProp="description"
              >
                {pick(lang, heroCopy.subtitle)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
                <a
                  href="#generator"
                  className="btn-press rounded-full bg-[#2ceef0] px-4 py-2 text-[11px] font-semibold text-black transition hover:brightness-110 sm:px-5 sm:py-2 sm:text-xs"
                >
                  {pick(lang, HERO_CTA.primary)}
                </a>
                <a
                  href="#examples"
                  className="btn-press rounded-full border border-white/10 px-4 py-2 text-[11px] text-zinc-200 transition hover:border-white/30 hover:bg-white/5 sm:px-5 sm:py-2 sm:text-xs"
                  onClick={() =>
                    trackEvent("cta_examples_click", {
                      variant: heroVariant,
                      lang,
                    })
                  }
                >
                  {pick(lang, HERO_CTA.secondary)}
                </a>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-zinc-400 sm:mt-6 sm:gap-3 sm:text-xs">
                {HERO_BULLETS.map((item) => (
                  <span
                    key={item.en}
                    className="rounded-full border border-white/10 bg-black/40 px-2 py-1 sm:px-3 sm:py-1"
                  >
                    {pick(lang, item)}
                  </span>
                ))}
              </div>
            </article>

            <div
              className="reveal reveal-delay-1 grid gap-4 sm:grid-cols-3"
              role="list"
              aria-label="Key statistics"
            >
              {STATS.map((stat) => (
                <div
                  key={stat.label.en}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  role="listitem"
                >
                  <p className="text-2xl font-semibold text-white">
                    {pick(lang, stat.value)}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {pick(lang, stat.label)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="reveal reveal-delay-2 rounded-3xl border border-white/10 bg-black/40 p-6"
            role="region"
            aria-label="Demo example"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              Before → After
            </p>
            <div className="mt-6 space-y-4">
              <div
                className="rounded-2xl border border-white/10 bg-black/50 p-4"
                role="presentation"
              >
                <p className="text-xs text-zinc-500">Input</p>
                <p className="mt-2 text-sm text-zinc-200">
                  {pick(lang, demoExample.input)}
                </p>
              </div>
              <div
                className="rounded-2xl border border-[#2ceef0]/40 bg-[#2ceef0]/10 p-4"
                role="presentation"
              >
                <p className="text-xs text-[#2ceef0]">Output</p>
                <p className="mt-2 text-base text-white">
                  {pick(lang, demoExample.caption)}
                </p>
                <p className="mt-2 text-xs text-zinc-200">
                  {demoExample.hashtags}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  {pick(lang, demoExample.affiliate)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="reveal reveal-delay-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-labelledby="features-heading"
        >
          <h2 id="features-heading" className="sr-only">
            {lang === "zh" ? "功能特点" : "Features"}
          </h2>
          {FEATURES.map((feature) => (
            <article
              key={feature.title.en}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="text-2xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {pick(lang, feature.title)}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                {pick(lang, feature.description)}
              </p>
            </article>
          ))}
        </section>

        <section className="space-y-6" aria-labelledby="community-heading">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              Community
            </p>
            <h2 id="community-heading" className="mt-3 text-2xl font-semibold">
              {lang === "zh" ? "为这些人而生" : "Built for"}
            </h2>
          </div>
          <div
            className="grid gap-4 md:grid-cols-4"
            role="list"
            aria-label="Target audience"
          >
            {COMMUNITY.map((item) => (
              <article
                key={item.title.en}
                className="rounded-2xl border border-white/10 bg-black/40 p-5 text-sm"
                role="listitem"
              >
                <p className="text-base font-semibold text-white">
                  {pick(lang, item.title)}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  {pick(lang, item.description)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="generator"
          className="space-y-4 sm:space-y-6"
          aria-labelledby="generator-heading"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
                Generator
              </p>
              <h2
                id="generator-heading"
                className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl"
              >
                Status Forge
              </h2>
            </div>
            <div className="text-[11px] text-zinc-400 sm:text-xs">
              {t.modeHint}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.6fr] xl:gap-6">
            <div
              ref={generatorRef}
              className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:rounded-3xl sm:p-6"
              role="region"
              aria-label="Caption generator form"
            >
              <fieldset className="flex flex-wrap items-center justify-between gap-3 border-0 p-0 m-0">
                <legend className="sr-only">Mode Selection</legend>
                <span className="text-xs text-zinc-400">
                  {isPro ? t.badgePro : t.badgeStandard}
                </span>
                <div
                  className="flex gap-1.5 text-[11px] sm:gap-2 sm:text-xs"
                  role="group"
                  aria-label={
                    lang === "zh" ? "语气模式选择" : "Tone mode selection"
                  }
                >
                  {MODES.map((item) => (
                    <button
                      key={item}
                      onClick={() => setMode(item)}
                      disabled={!isPro && item !== "Standard"}
                      aria-pressed={mode === item}
                      aria-disabled={!isPro && item !== "Standard"}
                      className={`btn-press rounded-full px-2.5 py-1 transition ${
                        mode === item
                          ? "bg-white text-black"
                          : "border border-white/10 text-zinc-300 hover:border-white/30 hover:bg-white/5"
                      } ${!isPro && item !== "Standard" ? "opacity-40 cursor-not-allowed" : ""} sm:px-3 sm:py-1`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label htmlFor="caption-input" className="sr-only">
                Caption input
              </label>
              <textarea
                id="caption-input"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#2ceef0] focus:ring-2 focus:ring-[#2ceef0]/30 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-3"
                placeholder={t.placeholder}
                disabled={loading}
              />

              <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-400 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="image-upload"
                      className="text-xs text-zinc-300"
                    >
                      {t.uploadLabel}
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      disabled={!isPro}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setImageFile(file);
                      }}
                      className="text-[11px] text-zinc-400 file:mr-2 file:rounded-full file:border-0 file:bg-white/10 file:px-2.5 file:py-1 file:text-[11px] file:text-white file:transition file:hover:bg-white/20 sm:text-xs sm:file:mr-3 sm:file:px-3 sm:file:py-1 sm:file:text-xs"
                    />
                  </div>
                  {!isPro ? (
                    <p className="text-[11px] text-zinc-500 sm:text-xs">
                      {t.uploadHint}
                    </p>
                  ) : null}
                  {imageFile ? (
                    <div className="flex items-center justify-between rounded-lg bg-[#2ceef0]/10 px-2 py-1.5">
                      <p className="truncate text-[11px] text-[#2ceef0] sm:text-xs">
                        {t.uploadSelected} {imageFile.name}
                      </p>
                      <button
                        onClick={handleRemoveImage}
                        className="shrink-0 text-[11px] text-zinc-400 hover:text-white sm:text-xs"
                        aria-label={t.imageRemove}
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {error ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#f6b73c]/10 border border-[#f6b73c]/30 px-3 py-2 sm:mt-4">
                  <span className="text-[#f6b73c] shrink-0">⚠</span>
                  <p className="text-[11px] text-[#f6b73c] sm:text-xs">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-[#f6b73c] hover:text-white"
                    aria-label={t.close}
                  >
                    ✕
                  </button>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
                <button
                  id="generate-btn"
                  onClick={handleGenerate}
                  disabled={loading || !text.trim()}
                  className="btn-press flex-1 rounded-xl bg-[#2ceef0] px-4 py-2.5 text-[11px] font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 sm:rounded-2xl sm:py-3 sm:text-xs"
                  aria-describedby="generate-hint"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      {t.generating}
                    </span>
                  ) : (
                    t.generate
                  )}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !text.trim()}
                  className="btn-press rounded-xl border border-white/10 px-3 py-2.5 text-[11px] text-white transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs"
                  aria-label={t.regenerate}
                >
                  ↻
                </button>
                <span id="generate-hint" className="sr-only">
                  Press Ctrl+Enter to generate
                </span>
              </div>
            </div>

            <div
              className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6"
              role="region"
              aria-live="polite"
              aria-atomic="true"
            >
              <h3 className="text-base font-semibold sm:text-lg">
                {t.resultsTitle}
              </h3>
              <p className="mt-1.5 text-sm text-zinc-400 sm:mt-2">
                {t.resultsDesc}
              </p>

              {result ? (
                <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 sm:rounded-2xl sm:p-4">
                    <p className="text-base font-semibold text-white leading-relaxed sm:text-lg">
                      {result.caption}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
                      <button
                        onClick={handleCopy}
                        className={`btn-press rounded-lg border px-2.5 py-1 text-[11px] transition sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs ${
                          copiedIndex === 0
                            ? "border-[#2ceef0] bg-[#2ceef0]/20 text-[#2ceef0]"
                            : "border-[#2ceef0]/40 text-[#2ceef0] hover:bg-[#2ceef0]/10"
                        }`}
                      >
                        {copiedIndex === 0 ? t.copied : t.copy}
                      </button>
                      <button
                        onClick={handleCopyAll}
                        className={`btn-press rounded-lg border px-2.5 py-1 text-[11px] transition sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs ${
                          copiedIndex === 1
                            ? "border-[#2ceef0] bg-[#2ceef0]/20 text-[#2ceef0]"
                            : "border-[#2ceef0]/40 text-[#2ceef0] hover:bg-[#2ceef0]/10"
                        }`}
                      >
                        {copiedIndex === 1 ? t.copied : t.copyAll}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-300 sm:rounded-2xl sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
                      {t.hashtags}
                    </p>
                    <p className="mt-1.5 break-words sm:mt-2">
                      {result.hashtags}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-300 sm:rounded-2xl sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
                      {t.detected}
                    </p>
                    <p className="mt-1.5 sm:mt-2">
                      {result.detected_object || t.detectedNone}
                    </p>
                  </div>

                  {isPro && result.affiliate ? (
                    <div className="rounded-xl border border-[#2ceef0]/40 bg-[#2ceef0]/10 p-3 sm:rounded-2xl sm:p-4">
                      <p className="text-sm text-white">
                        {result.affiliate.text[lang]}
                      </p>
                      <a
                        href={result.affiliate.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-2 inline-flex text-xs text-[#2ceef0] hover:underline sm:mt-3"
                      >
                        {t.affiliateCta}
                      </a>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 sm:rounded-2xl sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
                      {t.feedbackTitle}
                    </p>
                    <div className="mt-2 flex items-center gap-2 sm:mt-3 sm:gap-3">
                      <button
                        onClick={() => handleFeedback(1)}
                        disabled={feedbackRating !== null}
                        aria-label="Good result"
                        className={`btn-press rounded-full border px-2.5 py-1 text-sm transition sm:px-3 sm:py-1 ${
                          feedbackRating === 1
                            ? "border-[#2ceef0] bg-[#2ceef0]/20 text-[#2ceef0]"
                            : "border-white/10 text-zinc-300 hover:border-white/30 hover:bg-white/5"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(-1)}
                        disabled={feedbackRating !== null}
                        aria-label="Bad result"
                        className={`btn-press rounded-full border px-2.5 py-1 text-sm transition sm:px-3 sm:py-1 ${
                          feedbackRating === -1
                            ? "border-[#f6b73c] bg-[#f6b73c]/20 text-[#f6b73c]"
                            : "border-white/10 text-zinc-300 hover:border-white/30 hover:bg-white/5"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        👎
                      </button>
                      {feedbackRating !== null ? (
                        <span className="text-[11px] text-zinc-400 sm:text-xs">
                          {t.feedbackThanks}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div
                  className="mt-4 space-y-3 sm:mt-6 sm:space-y-4"
                  aria-hidden="true"
                >
                  <div className="skeleton h-20 w-full" />
                  <div className="skeleton h-12 w-3/4" />
                  <div className="skeleton h-12 w-1/2" />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/30 p-4 text-center text-sm text-zinc-500 sm:mt-6 sm:rounded-2xl">
                  {t.emptyState}
                </div>
              )}

              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 sm:mt-6 sm:rounded-2xl sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
                  {t.historyTitle}
                </p>
                {history.length ? (
                  <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleHistoryItemClick(item)}
                        className="w-full rounded-lg border border-white/10 bg-black/40 p-2.5 text-left transition hover:border-white/30 hover:bg-black/50 sm:rounded-xl sm:p-3"
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span className="rounded bg-white/5 px-1.5 py-0.5">
                            {item.mode}
                          </span>
                          <span>
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-1.5 truncate text-sm text-white sm:mt-2">
                          {item.caption}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-zinc-400 sm:text-[11px]">
                          {item.hashtags}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-zinc-500 sm:mt-3 sm:text-xs">
                    {t.historyEmpty}
                  </p>
                )}
              </div>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:rounded-3xl sm:p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
                  {t.railTitle}
                </p>
                <p className="mt-1.5 text-sm text-zinc-300 sm:mt-2">
                  {t.railSubtitle}
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-3">
                  <div className="flex items-center justify-between">
                    <span>{planLabel}</span>
                    <span className="text-[#2ceef0]">{quotaLabel}</span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-zinc-400 sm:mt-4 sm:text-xs">
                  {t.privacy}
                </p>
              </div>

              {!isPro ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6">
                  <h3 className="text-base font-semibold sm:text-lg">
                    {t.wishTitle}
                  </h3>
                  <p className="mt-1.5 text-sm text-zinc-400 sm:mt-2">
                    {t.wishDesc}
                  </p>
                  {!session ? (
                    <div>
                      <label htmlFor="wish-email" className="sr-only">
                        {t.wishPlaceholder}
                      </label>
                      <input
                        id="wish-email"
                        value={wishEmail}
                        onChange={(event) => setWishEmail(event.target.value)}
                        type="email"
                        placeholder={t.wishPlaceholder}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#f6b73c] focus:ring-2 focus:ring-[#f6b73c]/30 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-3"
                      />
                    </div>
                  ) : null}
                  <button
                    onClick={handleWishlist}
                    disabled={
                      wishStatus === t.wishSuccess || (!session && !wishEmail)
                    }
                    className="btn-press mt-3 w-full rounded-xl border border-[#f6b73c]/40 bg-[#f6b73c]/10 py-2.5 text-[11px] font-semibold text-[#f6b73c] transition hover:border-[#f6b73c] hover:bg-[#f6b73c]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-4 sm:rounded-2xl sm:py-3 sm:text-xs"
                  >
                    {wishStatus === t.wishSuccess
                      ? "✓ " + t.wishSuccess
                      : t.wishButton}
                  </button>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section id="tiers" className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              Access
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              <span itemProp="name">Guest / User / Pro</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name.en}
                className="rounded-3xl border border-white/10 bg-black/40 p-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {pick(lang, tier.name)}
                  </h3>
                  {tier.badge ? (
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-zinc-300">
                      {pick(lang, tier.badge)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {pick(lang, tier.description)}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-200">
                  {tier.features.map((feature) => (
                    <li key={feature.en} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2ceef0]" />
                      {pick(lang, feature)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 sm:space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
              How it works
            </p>
            <h2 className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl">
              3-step flow
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title.en}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6"
              >
                <p className="text-[10px] text-zinc-500 sm:text-xs">
                  0{index + 1}
                </p>
                <h3 className="mt-2 text-base font-semibold sm:mt-3 sm:text-lg">
                  {pick(lang, step.title)}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-400 sm:mt-2">
                  {pick(lang, step.description)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="examples" className="space-y-4 sm:space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
              Examples
            </p>
            <h2 className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl">
              Real outputs
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
            {EXAMPLES.map((example) => (
              <div
                key={example.title.en}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:rounded-3xl sm:p-6"
              >
                <p className="text-[10px] text-zinc-500 sm:text-xs">
                  {pick(lang, example.title)}
                </p>
                <p className="mt-2 text-sm text-zinc-400 sm:mt-3">
                  {pick(lang, example.input)}
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/50 p-3 sm:mt-4 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] text-zinc-500 sm:text-xs">
                    {example.mode}
                  </p>
                  <p className="mt-1.5 text-sm text-white sm:mt-2">
                    {pick(lang, example.caption)}
                  </p>
                  <p className="mt-1.5 text-[11px] text-zinc-300 sm:mt-2 sm:text-xs">
                    {example.hashtags}
                  </p>
                </div>
                <p className="mt-2 text-[11px] text-zinc-400 sm:mt-3 sm:text-xs">
                  {pick(lang, example.affiliate)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="space-y-4 sm:space-y-6"
          aria-labelledby="faq-heading"
          itemScope
          itemType="https://schema.org/FAQPage"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl"
            >
              Questions
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {FAQS.map((faq) => (
              <div
                key={faq.question.en}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <h3
                  className="text-sm font-semibold sm:text-base"
                  itemProp="name"
                >
                  {pick(lang, faq.question)}
                </h3>
                <div
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <p
                    className="mt-2 text-sm text-zinc-400 sm:mt-3"
                    itemProp="text"
                  >
                    {pick(lang, faq.answer)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer
          className="flex flex-col flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] text-zinc-500 sm:flex-row sm:pt-8 sm:text-xs"
          role="contentinfo"
        >
          <span itemProp="copyrightYear">© 2026</span>{" "}
          <span itemProp="copyrightHolder">LitStatus</span>
          <nav aria-label="Footer navigation" className="flex gap-3 sm:gap-4">
            <Link
              href="/examples"
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              Examples
            </Link>
            <Link
              href="/pricing"
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              Access
            </Link>
            <Link
              href="/faq"
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              FAQ
            </Link>
          </nav>
        </footer>
      </main>

      {!isPro ? (
        <div className="fixed bottom-6 left-1/2 z-20 w-[min(92vw,820px)] -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-6 py-3 text-center text-xs text-zinc-300 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
          {t.adBanner}
        </div>
      ) : null}
    </div>
  );
}
