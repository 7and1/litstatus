"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { LIMITS, MODES, type Mode, type QuotaStatus } from "@/lib/constants";
import { localizePath, type Lang } from "@/lib/i18n";
import { trackEvent, trackFunnelEvent } from "@/lib/analytics";
import { getAttributionProps } from "@/lib/attribution";
import { useABVariant } from "@/lib/ab";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { OnlineStatus } from "@/components/OnlineStatus";
import CookieConsent from "@/components/CookieConsent";
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
  pick,
} from "@/lib/content";
import { CASE_STUDIES, USE_CASES } from "@/lib/useCases";
import { safeFetch, logError, setupGlobalErrorHandlers } from "@/lib/errors";
import Turnstile, { type TurnstileHandle } from "@/components/Turnstile";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com")
  .replace(/\/$/, "");
const HOME_SCHEMA_COPY = {
  en: {
    name: "LitStatus - AI Caption Generator",
    description:
      "Generate viral captions and hashtags in seconds with AI. Three tone modes for Instagram, TikTok, and more.",
    mainEntityName: "LitStatus AI Caption Generator",
  },
  zh: {
    name: "LitStatus - AI 文案生成器",
    description:
      "AI 秒出文案与标签，三种语气，适配 Instagram、TikTok 等平台。",
    mainEntityName: "LitStatus AI 文案生成器",
  },
} as const;

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

type CropPreset = "original" | "1:1" | "4:5" | "9:16";

const CROP_PRESETS: CropPreset[] = ["original", "1:1", "4:5", "9:16"];

const HISTORY_KEY = "litstatus_history";

const COPY = {
  en: {
    headerBrand: "LitStatus",
    headerDomain: "litstatus.com",
    quotaUnlimited: "Unlimited",
    badgeFree: "Free access",
    generatorKicker: "Generator",
    generatorTitle: "Status Forge",
    modeHint: "Pick a tone and generate instantly.",
    modeLegend: "Tone selection",
    captionInputLabel: "Describe your moment",
    placeholder: "Example: Just posted my AJ1s—need a savage caption...",
    textCountLabel: "Characters",
    uploadLabel: "Upload image (Vision)",
    uploadHint: "Vision is included for everyone.",
    uploadTypeHint: "PNG, JPG, WEBP, GIF up to 10MB.",
    uploadSelected: "Selected:",
    generate: "Generate",
    generating: "Generating...",
    regenerate: "Regenerate",
    copy: "Copy",
    copyAll: "Copy caption + hashtags",
    copied: "Copied!",
    copyFailed: "Copy failed.",
    previewLabel: "Image preview",
    cropLabel: "Crop",
    cropOriginal: "Original",
    cropSquare: "1:1",
    cropFourFive: "4:5",
    cropNineSixteen: "9:16",
    cropping: "Cropping...",
    resultsTitle: "Results",
    resultsDesc: "Caption, hashtags, and detected object.",
    hashtags: "Hashtags",
    detected: "Detected",
    detectedNone: "No specific object detected",
    affiliateCta: "Open Amazon recommendation →",
    emptyState: "Nothing yet. Start on the left.",
    emptyInput: "Add text or upload an image to generate.",
    textTooLong: "Text too long. Max 2000 characters.",
    imageTypeError: "Unsupported image type.",
    imageSizeError: "Image too large. Max 10MB.",
    genericError: "Something went wrong. Please try again.",
    useCasesKicker: "Use cases",
    useCasesTitle: "Platform playbooks",
    useCasesSubtitle: "Instagram, TikTok, and Xiaohongshu ready-to-run flows.",
    useCaseLabel: "Use case",
    caseStudyLabel: "Case study",
    historyTitle: "Recent generations",
    historyEmpty: "No history yet.",
    captchaTitle: "Verification",
    captchaHint: "Complete the verification to generate.",
    captchaMissing: "Please complete the verification.",
    captchaFailed: "Verification failed. Please try again.",
    captchaMisconfigured: "Captcha misconfigured. Please try again later.",
    railTitle: "Your access",
    railSubtitle: "Live quota and status.",
    adBanner: "Ad banner slot: brand placement / affiliate / CPM",
    langToggle: "EN / 中文",
    langLabel: "Language",
    feedbackTitle: "Was this good?",
    feedbackThanks: "Thanks for the feedback.",
    privacy: "We never store your inputs. Each request is processed once.",
    generatorRegionLabel: "Caption generator form",
    generateHint: "Press Ctrl+Enter to generate",
    statsLabel: "Key statistics",
    demoRegionLabel: "Demo example",
    demoKicker: "Before → After",
    demoInputLabel: "Input",
    demoOutputLabel: "Output",
    audienceLabel: "Target audience",
    feedbackUpLabel: "Good result",
    feedbackDownLabel: "Bad result",
    footerNavLabel: "Footer navigation",
    mobileCta: "Generate now",
    close: "Close",
    imageRemove: "Remove image",
  },
  zh: {
    headerBrand: "LitStatus",
    headerDomain: "litstatus.com",
    quotaUnlimited: "无限",
    badgeFree: "免费开放",
    generatorKicker: "生成器",
    generatorTitle: "文案工坊",
    modeHint: "选择语气，立即生成。",
    modeLegend: "语气选择",
    captionInputLabel: "描述你的场景",
    placeholder: "例如：刚晒完 AJ1，想来一句狠的...",
    textCountLabel: "字符数",
    uploadLabel: "上传图片 (识图)",
    uploadHint: "识图功能全员可用。",
    uploadTypeHint: "支持 PNG/JPG/WEBP/GIF，最大 10MB。",
    uploadSelected: "已选择：",
    generate: "生成",
    generating: "生成中...",
    regenerate: "再来一条",
    copy: "一键复制",
    copyAll: "复制文案 + 标签",
    copied: "已复制！",
    copyFailed: "复制失败。",
    previewLabel: "图片预览",
    cropLabel: "裁剪",
    cropOriginal: "原图",
    cropSquare: "1:1",
    cropFourFive: "4:5",
    cropNineSixteen: "9:16",
    cropping: "裁剪中...",
    resultsTitle: "生成结果",
    resultsDesc: "文案、标签与识别物体。",
    hashtags: "标签",
    detected: "检测到",
    detectedNone: "未检测到具体物体",
    affiliateCta: "打开 Amazon 推荐 →",
    emptyState: "还没有生成内容，先在左侧输入。",
    emptyInput: "请先输入文字或上传图片。",
    textTooLong: "文字过长，最多 2000 字符。",
    imageTypeError: "图片格式不支持。",
    imageSizeError: "图片过大，最大 10MB。",
    genericError: "出错了，请稍后重试。",
    useCasesKicker: "使用场景",
    useCasesTitle: "平台打法",
    useCasesSubtitle: "Instagram、TikTok、小红书的原生文案模板。",
    useCaseLabel: "使用场景",
    caseStudyLabel: "长文案例",
    historyTitle: "最近生成",
    historyEmpty: "暂无历史记录。",
    captchaTitle: "验证码",
    captchaHint: "完成验证后才能生成。",
    captchaMissing: "请完成验证。",
    captchaFailed: "验证失败，请重试。",
    captchaMisconfigured: "验证码配置异常，请稍后重试。",
    railTitle: "当前权限",
    railSubtitle: "实时配额与状态。",
    adBanner: "广告 Banner 位：可接入品牌合作 / 推荐位 / CPM 广告条",
    langToggle: "EN / 中文",
    langLabel: "语言",
    feedbackTitle: "这条好用吗？",
    feedbackThanks: "感谢反馈。",
    privacy: "不保存输入内容，每次请求独立生成。",
    generatorRegionLabel: "文案生成器",
    generateHint: "按 Ctrl+Enter 生成",
    statsLabel: "核心数据",
    demoRegionLabel: "演示示例",
    demoKicker: "前后对比",
    demoInputLabel: "输入",
    demoOutputLabel: "输出",
    audienceLabel: "适用人群",
    feedbackUpLabel: "有用",
    feedbackDownLabel: "不好用",
    footerNavLabel: "页脚导航",
    mobileCta: "立即生成",
    close: "关闭",
    imageRemove: "移除图片",
  },
} as const;

const PLAN_LABELS = {
  en: { guest: "Free", user: "Free", pro: "Free" },
  zh: { guest: "免费", user: "免费", pro: "免费" },
} as const;

type HomeClientProps = {
  lang: Lang;
};

export default function HomeClient({ lang }: HomeClientProps) {
  const [mode, setMode] = useState<Mode>("Standard");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rawImageFile, setRawImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [cropPreset, setCropPreset] = useState<CropPreset>("original");
  const [cropLoading, setCropLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const turnstileRef = useRef<TurnstileHandle | null>(null);
  const generatorRef = useRef<HTMLDivElement>(null);
  const heroVariant = useABVariant("hero_demo_v1");
  const schemaCopy = HOME_SCHEMA_COPY[lang];
  const canonicalUrl = `${SITE_URL}${localizePath("/", lang)}`;
  const buildEventProps = useCallback(
    (extra?: Record<string, string | number | boolean | null>) => ({
      ...getAttributionProps(),
      ...extra,
      lang,
      variant: heroVariant,
    }),
    [lang, heroVariant],
  );
  const trackFunnel = useCallback(
    (event: string, extra?: Record<string, string | number | boolean | null>) =>
      trackFunnelEvent(event, buildEventProps(extra)),
    [buildEventProps],
  );
  // Toast notification
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    },
    [],
  );

  const updatePreview = useCallback(
    (file: File | null) => {
      setImagePreviewUrl((current) => {
        if (current) {
          try {
            URL.revokeObjectURL(current);
          } catch {
            // Ignore URL revocation errors
          }
        }
        return file ? URL.createObjectURL(file) : null;
      });
    },
    [setImagePreviewUrl],
  );

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        try {
          URL.revokeObjectURL(imagePreviewUrl);
        } catch {
          // Ignore URL revocation errors
        }
      }
    };
  }, [imagePreviewUrl]);

  const cropImageToAspect = useCallback(
    async (file: File, aspect: number) => {
      const image = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Failed to load image"));
          image.src = objectUrl;
        });
      } finally {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignore URL revocation errors
        }
      }

      const { width, height } = image;
      const currentAspect = width / height;
      let cropWidth = width;
      let cropHeight = height;

      if (currentAspect > aspect) {
        cropWidth = Math.round(height * aspect);
      } else if (currentAspect < aspect) {
        cropHeight = Math.round(width / aspect);
      }

      const startX = Math.round((width - cropWidth) / 2);
      const startY = Math.round((height - cropHeight) / 2);

      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.drawImage(
        image,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (result) => resolve(result),
          file.type || "image/jpeg",
          0.92,
        );
      });

      if (!blob) throw new Error("Crop failed");

      return new File([blob], file.name, { type: blob.type });
    },
    [],
  );

  // Setup global error handlers
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

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

  const t = COPY[lang];
  const heroCopy = HERO_VARIANTS[heroVariant];
  const demoExample = DEMO_VARIANTS[heroVariant];
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  const applyCropPreset = useCallback(
    async (preset: CropPreset) => {
      if (!rawImageFile) return;
      if (preset === "original") {
        setCropPreset(preset);
        setImageFile(rawImageFile);
        updatePreview(rawImageFile);
        return;
      }

      const aspectMap: Record<CropPreset, number> = {
        original: 1,
        "1:1": 1,
        "4:5": 4 / 5,
        "9:16": 9 / 16,
      };

      try {
        setCropLoading(true);
        const cropped = await cropImageToAspect(rawImageFile, aspectMap[preset]);
        setCropPreset(preset);
        setImageFile(cropped);
        updatePreview(cropped);
      } catch {
        setError(t.imageTypeError);
      } finally {
        setCropLoading(false);
      }
    },
    [rawImageFile, cropImageToAspect, updatePreview, t.imageTypeError],
  );

  const planLabel = quota?.plan
    ? PLAN_LABELS[lang][quota.plan]
    : PLAN_LABELS[lang].guest;

  const quotaLabel = quota
    ? `${quota.remaining ?? 0} / ${quota.limit ?? 0}`
    : "-";
  const canGenerate = Boolean(
    (text.trim() || imageFile) && turnstileToken && turnstileSiteKey,
  );
  const cropLabels: Record<CropPreset, string> = {
    original: t.cropOriginal,
    "1:1": t.cropSquare,
    "4:5": t.cropFourFive,
    "9:16": t.cropNineSixteen,
  };

  const fetchQuota = async () => {
    const response = await fetch("/api/quota");
    if (!response.ok) return;
    const data = await response.json();
    if (data.quota) {
      setQuota(data.quota);
    }
  };

  useEffect(() => {
    fetchQuota();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setError(null);
    const trimmed = text.trim();
    const hasImage = Boolean(imageFile);

    if (!trimmed && !hasImage) {
      setError(t.emptyInput);
      return;
    }

    if (!turnstileSiteKey) {
      setError(t.captchaMisconfigured);
      return;
    }

    if (!turnstileToken) {
      setError(t.captchaMissing);
      return;
    }

    if (trimmed.length > LIMITS.MAX_TEXT_LENGTH) {
      setError(t.textTooLong);
      return;
    }

    if (hasImage && imageFile) {
      if (
        !LIMITS.ALLOWED_IMAGE_TYPES.includes(
          imageFile.type as (typeof LIMITS.ALLOWED_IMAGE_TYPES)[number],
        )
      ) {
        setError(t.imageTypeError);
        return;
      }
      if (imageFile.size > LIMITS.MAX_IMAGE_SIZE_BYTES) {
        setError(t.imageSizeError);
        return;
      }
    }

    setLoading(true);
    setResult(null);
    setFeedbackRating(null);
    trackEvent(
      "cta_generate_click",
      buildEventProps({ mode, has_image: hasImage }),
    );

    const formData = new FormData();
    if (trimmed) formData.append("text", trimmed);
    formData.append("mode", mode);
    formData.append("lang", lang);

    if (hasImage && imageFile) {
      formData.append("image", imageFile);
    }
    formData.append("turnstileToken", turnstileToken);

    let response: Response;
    try {
      response = await safeFetch("/api/generate", {
        method: "POST",
        body: formData,
        timeout: 60000,
        retries: 2,
      });
    } catch (fetchError) {
      const error = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      logError(error, {
        context: "generate",
        mode,
        hasImage,
      });
      setError(t.genericError);
      setLoading(false);
      trackEvent("generate_error", buildEventProps({ mode, has_image: hasImage }));
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? t.genericError);
      if (data.quota) setQuota(data.quota);
      setLoading(false);
      trackEvent("generate_error", buildEventProps({ mode, has_image: hasImage }));
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      return;
    }

    setResult(data);
    if (data.quota) setQuota(data.quota);
    setLoading(false);
    trackFunnel("generate_success", { mode, has_image: hasImage });
    turnstileRef.current?.reset();
    setTurnstileToken(null);

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
      trackFunnel("copy_caption", { mode });
    } catch {
      showToast(t.copyFailed, "error");
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
      trackFunnel("copy_all", { mode });
    } catch {
      showToast(t.copyFailed, "error");
    }
  };

  const handleRemoveImage = useCallback(() => {
    setRawImageFile(null);
    setImageFile(null);
    setCropPreset("original");
    updatePreview(null);
    const fileInput = document.querySelector<HTMLInputElement>(
      "input[type='file']",
    );
    if (fileInput) {
      fileInput.value = "";
    }
  }, [updatePreview]);

  const handleHistoryItemClick = useCallback((item: HistoryItem) => {
    setText(item.caption);
    setMode(item.mode);
    generatorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const handleFeedback = async (rating: 1 | -1) => {
    if (!result) return;
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      trackFunnel(rating === 1 ? "feedback_up" : "feedback_down", { mode });
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
            name: schemaCopy.name,
            description: schemaCopy.description,
            url: canonicalUrl,
            inLanguage: lang === "zh" ? "zh-CN" : "en",
            about: {
              "@type": "SoftwareApplication",
              name: "LitStatus",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web",
            },
            mainEntity: {
              "@type": "SoftwareApplication",
              name: schemaCopy.mainEntityName,
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
                <Link
                  href={localizePath("/", lang)}
                  className="hover:opacity-80 transition-opacity"
                >
                  {t.headerDomain}
                </Link>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher lang={lang} />
            <div
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-zinc-300 sm:px-4 sm:py-2 sm:text-xs"
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">{t.railTitle}: </span>
              {planLabel} · {quotaLabel}
            </div>
          </div>
        </header>

        <section
          className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10"
          aria-labelledby="hero-heading"
        >
          <div className="space-y-4 sm:space-y-6">
            <article className="reveal rounded-2xl border border-white/10 bg-black/50 p-5 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.9)] sm:rounded-3xl sm:p-8">
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
                {lang === "zh" ? "高能文案引擎" : "Lit captions engine"}
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
                    trackEvent("cta_examples_click", buildEventProps({}))
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
              aria-label={t.statsLabel}
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
            aria-label={t.demoRegionLabel}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              {t.demoKicker}
            </p>
            <div className="mt-6 space-y-4">
              <div
                className="rounded-2xl border border-white/10 bg-black/50 p-4"
                role="presentation"
              >
                <p className="text-xs text-zinc-500">{t.demoInputLabel}</p>
                <p className="mt-2 text-sm text-zinc-200">
                  {pick(lang, demoExample.input)}
                </p>
              </div>
              <div
                className="rounded-2xl border border-[#2ceef0]/40 bg-[#2ceef0]/10 p-4"
                role="presentation"
              >
                <p className="text-xs text-[#2ceef0]">{t.demoOutputLabel}</p>
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

        <section id="use-cases" className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              {t.useCasesKicker}
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              {t.useCasesTitle}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t.useCasesSubtitle}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {USE_CASES.map((item) => (
              <Link
                key={item.slug}
                href={localizePath(`/use-cases/${item.slug}`, lang)}
                className="rounded-3xl border border-white/10 bg-black/40 p-5 transition hover:border-white/30 hover:bg-white/5"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  {t.useCaseLabel}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {pick(lang, item.title)}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {pick(lang, item.subtitle)}
                </p>
              </Link>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {CASE_STUDIES.map((item) => (
              <Link
                key={item.slug}
                href={localizePath(`/case-studies/${item.slug}`, lang)}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30 hover:bg-white/5"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  {t.caseStudyLabel}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {pick(lang, item.title)}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {pick(lang, item.subtitle)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="community-heading">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
              {lang === "zh" ? "适用人群" : "Community"}
            </p>
            <h2 id="community-heading" className="mt-3 text-2xl font-semibold">
              {lang === "zh" ? "为这些人而生" : "Built for"}
            </h2>
          </div>
          <div
            className="grid gap-4 md:grid-cols-4"
            role="list"
            aria-label={t.audienceLabel}
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
                {t.generatorKicker}
              </p>
              <h2
                id="generator-heading"
                className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl"
              >
                {t.generatorTitle}
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
              aria-label={t.generatorRegionLabel}
            >
              <fieldset className="flex flex-wrap items-center justify-between gap-3 border-0 p-0 m-0">
                <legend className="sr-only">{t.modeLegend}</legend>
                <span className="text-xs text-zinc-400">{t.badgeFree}</span>
                <div
                  className="flex gap-1.5 text-[11px] sm:gap-2 sm:text-xs"
                  role="group"
                  aria-label={t.modeLegend}
                >
                  {MODES.map((item) => (
                    <button
                      key={item}
                      onClick={() => setMode(item)}
                      aria-pressed={mode === item}
                      className={`btn-press rounded-full px-2.5 py-1 transition ${
                        mode === item
                          ? "bg-white text-black"
                          : "border border-white/10 text-zinc-300 hover:border-white/30 hover:bg-white/5"
                      } sm:px-3 sm:py-1`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label htmlFor="caption-input" className="sr-only">
                {t.captionInputLabel}
              </label>
              <textarea
                id="caption-input"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                maxLength={LIMITS.MAX_TEXT_LENGTH}
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#2ceef0] focus:ring-2 focus:ring-[#2ceef0]/30 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-3"
                placeholder={t.placeholder}
                disabled={loading}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 sm:text-xs">
                <span>{t.textCountLabel}</span>
                <span
                  className={
                    text.length > LIMITS.MAX_TEXT_LENGTH * 0.9
                      ? "text-[#f6b73c]"
                      : ""
                  }
                >
                  {text.length}/{LIMITS.MAX_TEXT_LENGTH}
                </span>
              </div>

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
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (!file) {
                          setImageFile(null);
                          setRawImageFile(null);
                          updatePreview(null);
                          return;
                        }
                        if (
                          !LIMITS.ALLOWED_IMAGE_TYPES.includes(
                            file.type as (typeof LIMITS.ALLOWED_IMAGE_TYPES)[number],
                          )
                        ) {
                          setError(t.imageTypeError);
                          event.currentTarget.value = "";
                          return;
                        }
                        if (file.size > LIMITS.MAX_IMAGE_SIZE_BYTES) {
                          setError(t.imageSizeError);
                          event.currentTarget.value = "";
                          return;
                        }
                        setError(null);
                        setRawImageFile(file);
                        setCropPreset("original");
                        setImageFile(file);
                        updatePreview(file);
                      }}
                      className="text-[11px] text-zinc-400 file:mr-2 file:rounded-full file:border-0 file:bg-white/10 file:px-2.5 file:py-1 file:text-[11px] file:text-white file:transition file:hover:bg-white/20 sm:text-xs sm:file:mr-3 sm:file:px-3 sm:file:py-1 sm:file:text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 sm:text-xs">
                    {t.uploadHint}
                  </p>
                  <p className="text-[11px] text-zinc-500 sm:text-xs">
                    {t.uploadTypeHint}
                  </p>
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
                  {imagePreviewUrl ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/50 p-3">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black/60">
                        <NextImage
                          src={imagePreviewUrl}
                          alt={t.previewLabel}
                          fill
                          sizes="(max-width: 768px) 100vw, 480px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 sm:text-xs">
                        <span className="text-zinc-500">{t.cropLabel}</span>
                        {CROP_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => applyCropPreset(preset)}
                            disabled={cropLoading}
                            className={`btn-press rounded-full border px-2.5 py-1 transition ${
                              cropPreset === preset
                                ? "border-[#2ceef0] text-[#2ceef0]"
                                : "border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                            } ${cropLoading ? "opacity-50" : ""}`}
                          >
                            {cropLabels[preset]}
                          </button>
                        ))}
                        {cropLoading ? (
                          <span className="ml-2 text-zinc-500">
                            {t.cropping}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-3 sm:mt-5 sm:rounded-2xl sm:px-4 sm:py-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
                    {t.captchaTitle}
                  </p>
                  <p className="text-[11px] text-zinc-500 sm:text-xs">
                    {t.captchaHint}
                  </p>
                </div>
                {turnstileSiteKey ? (
                  <div className="mt-3">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={turnstileSiteKey}
                      onVerify={(token) => {
                        setError(null);
                        setTurnstileToken(token);
                      }}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => {
                        setTurnstileToken(null);
                        setError(t.captchaFailed);
                      }}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-[#f6b73c] sm:text-xs">
                    {t.captchaMisconfigured}
                  </p>
                )}
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
                  disabled={loading || !canGenerate}
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
                  disabled={loading || !canGenerate}
                  className="btn-press rounded-xl border border-white/10 px-3 py-2.5 text-[11px] text-white transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs"
                  aria-label={t.regenerate}
                >
                  ↻
                </button>
                <span id="generate-hint" className="sr-only">
                  {t.generateHint}
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

                  {result.affiliate ? (
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
                        aria-label={t.feedbackUpLabel}
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
                        aria-label={t.feedbackDownLabel}
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

            </aside>
          </div>
        </section>

        <section className="space-y-4 sm:space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
              {lang === "zh" ? "使用流程" : "How it works"}
            </p>
            <h2 className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl">
              {lang === "zh" ? "三步完成" : "3-step flow"}
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
              {lang === "zh" ? "示例" : "Examples"}
            </p>
            <h2 className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl">
              {lang === "zh" ? "真实输出" : "Real outputs"}
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
              {lang === "zh" ? "常见问题" : "FAQ"}
            </p>
            <h2
              id="faq-heading"
              className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl"
            >
              {lang === "zh" ? "问题解答" : "Questions"}
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
          <nav aria-label={t.footerNavLabel} className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              href={localizePath("/use-cases", lang)}
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              {lang === "zh" ? "使用场景" : "Use cases"}
            </Link>
            <Link
              href={localizePath("/case-studies", lang)}
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              {lang === "zh" ? "长文案例" : "Case studies"}
            </Link>
            <Link
              href={localizePath("/examples", lang)}
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              {lang === "zh" ? "示例" : "Examples"}
            </Link>
            <Link
              href={localizePath("/pricing", lang)}
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              {lang === "zh" ? "权限" : "Access"}
            </Link>
            <Link
              href={localizePath("/faq", lang)}
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              {lang === "zh" ? "常见问题" : "FAQ"}
            </Link>
            <Link
              href={localizePath("/privacy-policy", lang)}
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              {lang === "zh" ? "隐私政策" : "Privacy"}
            </Link>
            <Link
              href={localizePath("/terms-of-service", lang)}
              className="transition-colors hover:text-white focus:outline-none focus:underline"
            >
              {lang === "zh" ? "服务条款" : "Terms"}
            </Link>
          </nav>
        </footer>
      </main>

      <div className="fixed bottom-4 left-1/2 z-30 w-[min(94vw,420px)] -translate-x-1/2 sm:hidden">
        <button
          onClick={handleGenerate}
          disabled={loading || !canGenerate}
          className="btn-press w-full rounded-full bg-[#2ceef0] px-5 py-3 text-sm font-semibold text-black shadow-[0_20px_60px_-30px_rgba(44,238,240,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t.generating : t.mobileCta}
        </button>
      </div>

      <div className="fixed bottom-6 left-1/2 z-20 hidden w-[min(92vw,820px)] -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-6 py-3 text-center text-xs text-zinc-300 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur sm:block">
        {t.adBanner}
      </div>

      {/* Online/Offline Status Indicator */}
      <OnlineStatus position="bottom" />

      {/* Cookie Consent Banner (GDPR compliant) */}
      <CookieConsent lang={lang} />
    </div>
  );
}
