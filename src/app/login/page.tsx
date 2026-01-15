"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage("发送失败，请重试。");
    } else {
      setMessage("已发送登录邮件，请查收。");
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
        <Link href="/" className="mb-10 text-sm text-zinc-400 hover:text-white">
          ← 返回主页
        </Link>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.9)]">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            登录 LitStatus
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            支持邮箱 Magic Link 或 Google，一键解锁登录配额。
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleEmailLogin}>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Email
              </label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2ceef0] focus:ring-2 focus:ring-[#2ceef0]/30"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#2ceef0] py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "发送中..." : "发送登录链接"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-500">或</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 w-full rounded-2xl border border-white/10 bg-white/10 py-3 text-sm font-semibold text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            使用 Google 登录
          </button>

          {message ? (
            <p className="mt-6 text-sm text-[#f6b73c]">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
