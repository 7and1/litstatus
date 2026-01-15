"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { MODES, type Mode, type QuotaStatus } from "@/lib/constants";

// Local Session type for browser client compatibility
type Session = {
  access_token: string;
  user: {
    id: string;
    email: string | null;
  };
};

type GenerateResult = {
  caption: string;
  hashtags: string;
  detected_object: string | null;
  affiliate_category: string | null;
  affiliate: { text: string; link: string } | null;
  quota: QuotaStatus;
};

const MODE_DESCRIPTIONS: Record<Mode, string> = {
  Standard: "干净、稳、适合日常",
  Savage: "毒舌、狠话、炸场",
  Rizz: "撩人、氛围、心动",
};

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

  const authHeader = useMemo<HeadersInit | undefined>(() => {
    if (!session?.access_token) return undefined;
    return { Authorization: `Bearer ${session.access_token}` };
  }, [session]);

  const isPro = quota?.isPro ?? false;
  const planLabel = quota?.plan
    ? quota.plan === "pro"
      ? "Pro"
      : quota.plan === "user"
        ? "User"
        : "Guest"
    : "Guest";

  const quotaLabel = quota
    ? quota.isPro
      ? "Unlimited"
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

    const formData = new FormData();
    if (text.trim()) formData.append("text", text.trim());
    formData.append("mode", mode);

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
      setError(data.error ?? "生成失败，请重试。");
      if (data.quota) setQuota(data.quota as QuotaStatus);
      setLoading(false);
      return;
    }

    setResult(data as GenerateResult);
    if (data.quota) setQuota(data.quota as QuotaStatus);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!result?.caption) return;
    await navigator.clipboard.writeText(result.caption);
  };

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
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setWishStatus(data.error ?? "提交失败。");
      return;
    }

    setWishStatus("已加入 Pro Wish List，我们会通知你。");
    setWishEmail("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b0f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(44,238,240,0.35),rgba(11,11,15,0))] blur-3xl" />
        <div className="absolute right-[-10%] top-[30%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(246,183,60,0.35),rgba(11,11,15,0))] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(0,255,140,0.2),rgba(11,11,15,0))] blur-3xl" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <span className="text-lg font-display">LS</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                LitStatus
              </p>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                litstatus.com
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-zinc-300">
              {planLabel} · {quotaLabel}
            </div>
            {session ? (
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-200 transition hover:border-white/30"
              >
                退出
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-200 transition hover:border-white/30"
              >
                登录
              </Link>
            )}
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    Status Forge
                  </h2>
                  <p className="text-sm text-zinc-400">
                    输入文字或图片，直接生成爆款状态文案。
                  </p>
                </div>
                <span className="rounded-full border border-[#2ceef0]/30 bg-[#2ceef0]/10 px-3 py-1 text-xs text-[#2ceef0]">
                  {isPro ? "Pro 全解锁" : "Standard 模式"}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {MODES.map((item) => (
                  <button
                    key={item}
                    onClick={() => setMode(item)}
                    disabled={!isPro && item !== "Standard"}
                    className={`rounded-full px-4 py-2 text-xs transition ${
                      mode === item
                        ? "bg-white text-black"
                        : "border border-white/10 text-zinc-300 hover:border-white/30"
                    } ${!isPro && item !== "Standard" ? "opacity-40" : ""}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {MODE_DESCRIPTIONS[mode]}
              </p>

              <div className="mt-6 space-y-4">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2ceef0] focus:ring-2 focus:ring-[#2ceef0]/30"
                  placeholder="例如：刚晒完球鞋，想要一句超狠的朋友圈文案..."
                />

                <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-4 py-4 text-sm text-zinc-400">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between">
                      <span>上传图片 (Pro Vision)</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={!isPro}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setImageFile(file);
                        }}
                        className="text-xs text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white"
                      />
                    </label>
                    {!isPro ? (
                      <p className="text-xs text-zinc-500">
                        Pro 才能使用识图（AI Vision）。
                      </p>
                    ) : null}
                    {imageFile ? (
                      <p className="text-xs text-[#2ceef0]">
                        已选择：{imageFile.name}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {error ? (
                <p className="mt-4 text-sm text-[#f6b73c]">{error}</p>
              ) : null}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-[#2ceef0] py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "生成中..." : "生成 Lit 状态"}
              </button>
            </div>

            {!isPro ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-display text-lg font-semibold">
                  Pro Wish List
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  付费功能已开发，就差开通订阅。加入列表优先获取。
                </p>
                {!session ? (
                  <input
                    value={wishEmail}
                    onChange={(event) => setWishEmail(event.target.value)}
                    type="email"
                    placeholder="你希望通知的邮箱"
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#f6b73c] focus:ring-2 focus:ring-[#f6b73c]/30"
                  />
                ) : null}
                <button
                  onClick={handleWishlist}
                  className="mt-4 w-full rounded-2xl border border-[#f6b73c]/40 bg-[#f6b73c]/10 py-3 text-sm font-semibold text-[#f6b73c] transition hover:border-[#f6b73c]"
                >
                  加入 Wish List
                </button>
                {wishStatus ? (
                  <p className="mt-3 text-xs text-zinc-400">{wishStatus}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-display text-lg font-semibold">生成结果</h3>
              <p className="mt-2 text-sm text-zinc-400">
                自动输出文案、标签、识别物体。
              </p>

              {result ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-lg font-semibold text-white">
                      {result.caption}
                    </p>
                    <button
                      onClick={handleCopy}
                      className="mt-3 text-xs text-[#2ceef0]"
                    >
                      一键复制
                    </button>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                      Hashtags
                    </p>
                    <p className="mt-2">{result.hashtags}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                      Detected
                    </p>
                    <p className="mt-2">
                      {result.detected_object || "未检测到具体物体"}
                    </p>
                  </div>

                  {isPro && result.affiliate ? (
                    <div className="rounded-2xl border border-[#2ceef0]/40 bg-[#2ceef0]/10 p-4">
                      <p className="text-sm text-white">
                        {result.affiliate.text}
                      </p>
                      <a
                        href={result.affiliate.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs text-[#2ceef0]"
                      >
                        打开 Amazon 推荐 →
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm text-zinc-500">
                  还没有生成内容，先在左侧输入。
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {!isPro ? (
        <div className="fixed bottom-6 left-1/2 z-20 w-[min(92vw,820px)] -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-6 py-3 text-center text-xs text-zinc-300 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
          广告 Banner 位：可接入品牌合作 / 推荐位 / CPM 广告条
        </div>
      ) : null}
    </div>
  );
}
