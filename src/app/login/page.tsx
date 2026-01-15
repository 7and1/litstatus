"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Link from "next/link";
import { loadLang, saveLang, type Lang } from "@/lib/i18n";

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
  },
} as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>(() => loadLang());

  useEffect(() => {
    saveLang(lang);
  }, [lang]);

  const t = COPY[lang];

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setMessage(t.sendFailed);
    } else {
      setMessage(t.sendSuccess);
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setMessage(null);

    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center justify-between text-sm text-zinc-400">
          <Link href="/" className="hover:text-white">
            ← {t.back}
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:border-white/30"
          >
            {t.langToggle}
          </button>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.9)]">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="mt-3 text-sm text-zinc-400">{t.subtitle}</p>

          <form className="mt-8 space-y-4" onSubmit={handleEmailLogin}>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t.emailLabel}
              </label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2ceef0] focus:ring-2 focus:ring-[#2ceef0]/30"
                placeholder={t.emailPlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#2ceef0] py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t.sending : t.sendLink}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-500">{t.or}</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 w-full rounded-2xl border border-white/10 bg-white/10 py-3 text-sm font-semibold text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.google}
          </button>

          {message ? (
            <p className="mt-6 text-sm text-[#f6b73c]">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
