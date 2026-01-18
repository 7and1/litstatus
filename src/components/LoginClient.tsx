"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import type { Lang } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { Skeleton } from "@/components/Skeleton";

const COPY = {
  en: {
    back: "Back to home",
    title: "Sign in to LitStatus",
    subtitle: "Use magic link or Google to unlock user quota.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    sendLink: "Send login link",
    sending: "Sending...",
    or: "or",
    google: "Continue with Google",
    sendFailed: "Failed to send. Please try again.",
    sendSuccess: "Check your inbox for the login link.",
    langToggle: "EN / 中文",
    loading: "Loading...",
  },
  zh: {
    back: "返回主页",
    title: "登录 LitStatus",
    subtitle: "支持邮箱 Magic Link 或 Google，一键解锁登录配额。",
    emailLabel: "邮箱",
    emailPlaceholder: "you@example.com",
    sendLink: "发送登录链接",
    sending: "发送中...",
    or: "或",
    google: "使用 Google 登录",
    sendFailed: "发送失败，请重试。",
    sendSuccess: "已发送登录邮件，请查收。",
    langToggle: "EN / 中文",
    loading: "加载中...",
  },
} as const;

export default function LoginClient({ lang }: { lang: Lang }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimisticSent, setOptimisticSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const formRef = useRef<HTMLFormElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const t = COPY[lang];

  // Initialize on mount
  useEffect(() => {
    setIsReady(true);
    // Focus email input when ready
    emailInputRef.current?.focus();
  }, []);

  const handleEmailLogin = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    // Optimistic update
    setOptimisticSent(true);
    setLoading(true);
    setMessage(null);

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${localizePath("/", lang)}`,
      },
    });

    if (error) {
      setMessage(t.sendFailed);
      setMessageType("error");
      setOptimisticSent(false);
      // Re-focus email for retry
      emailInputRef.current?.focus();
    } else {
      setMessage(t.sendSuccess);
      setMessageType("success");
      setEmail("");
      setOptimisticSent(false);
    }

    setLoading(false);
  }, [email, lang, t, loading]);

  const handleGoogle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    try {
      await supabaseBrowser.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${localizePath("/", lang)}`,
        },
      });
    } catch {
      setLoading(false);
      setMessage(t.sendFailed);
      setMessageType("error");
    }
  }, [lang, t.sendFailed]);

  const handleToggle = useCallback(() => {
    const nextLang = lang === "en" ? "zh" : "en";
    router.push(localizePath(pathname, nextLang));
  }, [lang, pathname, router]);

  // Handle escape key to clear message
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && message) {
        setMessage(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [message]);

  // Show skeleton while loading
  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
          <div className="mb-10 flex h-8 items-center justify-between">
            <Skeleton width={120} height={32} />
            <Skeleton width={80} height={32} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10">
            <Skeleton width={200} height={40} className="mb-4" />
            <Skeleton width={300} height={20} className="mb-8" />
            <Skeleton width="100%" height={50} />
            <Skeleton width="100%" height={50} className="mt-6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center justify-between text-sm text-zinc-400">
          <Link
            href={localizePath("/", lang)}
            className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#2ceef0] focus:ring-offset-2 focus:ring-offset-[#0b0b0f] rounded px-2 py-1"
          >
            ← {t.back}
          </Link>
          <button
            onClick={handleToggle}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:border-white/30 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#2ceef0] focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
            aria-label={lang === "en" ? "Switch to Chinese" : "切换到英文"}
          >
            {t.langToggle}
          </button>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.9)]">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="mt-3 text-sm text-zinc-400">{t.subtitle}</p>

          <form
            ref={formRef}
            className="mt-8 space-y-4"
            onSubmit={handleEmailLogin}
            aria-busy={loading}
            aria-describedby={message ? "form-message" : undefined}
          >
            <div>
              <label
                htmlFor="email-input"
                className="text-xs uppercase tracking-[0.2em] text-zinc-500"
                id="email-label"
              >
                {t.emailLabel}
              </label>
              <input
                ref={emailInputRef}
                id="email-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2ceef0] focus:ring-2 focus:ring-[#2ceef0]/30 disabled:opacity-50"
                placeholder={t.emailPlaceholder}
                disabled={loading}
                aria-labelledby="email-label"
                aria-invalid={messageType === "error"}
                aria-describedby={message ? "form-message" : undefined}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || optimisticSent}
              className="btn-press w-full rounded-2xl bg-[#2ceef0] py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#2ceef0] focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
              aria-busy={loading}
            >
              {loading || optimisticSent ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" aria-hidden="true" />
                  <span>{optimisticSent ? t.sendSuccess : t.sending}</span>
                </span>
              ) : (
                t.sendLink
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3" role="separator" aria-orientation="horizontal">
            <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
            <span className="text-xs text-zinc-500">{t.or}</span>
            <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="btn-press mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-3 text-sm font-semibold text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
            aria-busy={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t.google}
          </button>

          {message ? (
            <div
              id="form-message"
              className={`mt-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                messageType === "error"
                  ? "border-[#f6b73c]/30 bg-[#f6b73c]/10 text-[#f6b73c]"
                  : "border-[#2ceef0]/30 bg-[#2ceef0]/10 text-[#2ceef0]"
              }`}
              role="alert"
              aria-live={messageType === "error" ? "assertive" : "polite"}
            >
              {messageType === "error" ? (
                <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>{message}</span>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto opacity-70 hover:opacity-100 focus:outline-none"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
