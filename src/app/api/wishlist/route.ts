import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSecurityHeaders } from "@/lib/security";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/security";
import { getClientIp } from "@/lib/ip";
import { wishlistInputSchema, validateJsonBody } from "@/lib/schemas";
import { logSecurityEvent } from "@/lib/securityEvents";
import { generateRequestId, createResponseHeaders } from "@/lib/requestContext";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const securityHeaders = getSecurityHeaders();
  const user = await getUserFromRequest(request);
  const ip = getClientIp(request);

  // Rate limiting
  const identifier = user?.id ?? ip ?? "unknown";
  const rateResult = await checkRateLimit(`wishlist:${identifier}`, 10, 60 * 1000);

  if (!rateResult.allowed) {
    await logSecurityEvent({
      event_type: "rate_limited",
      severity: "warn",
      user_id: user?.id ?? null,
      ip,
      path: new URL(request.url).pathname,
      user_agent: request.headers.get("user-agent"),
      meta: { endpoint: "wishlist" },
    });
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: createResponseHeaders(requestId, {
          ...securityHeaders,
          ...createRateLimitHeaders(rateResult),
        }),
      },
    );
  }

  // Validate request body with Zod
  const validation = await validateJsonBody(request, wishlistInputSchema);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status, headers: createResponseHeaders(requestId, securityHeaders) },
    );
  }

  const { email, note, lang, variant } = validation.data;
  const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

  // Add timeout for database operation
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), 28000)
  );

  try {
    const supabase = createSupabaseAdmin();
    const dbPromise = supabase.from("pro_wishlist").insert({
      user_id: user?.id ?? null,
      email,
      note: note ?? null,
      lang,
      variant: variant ?? null,
    });

    const { error } = await Promise.race([dbPromise, timeoutPromise]) as { error: unknown };

    if (error) throw error;

    // Fire-and-forget email notifications with timeout
    const resendKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;
    if (resendKey && resendFrom) {
      const subject =
        lang === "zh"
          ? "已加入 LitStatus Pro 预约名单"
          : "You are on the LitStatus Pro wish list";
      const html =
        lang === "zh"
          ? "<p>感谢加入 LitStatus Pro 预约名单。我们上线后会第一时间通知你。</p>"
          : "<p>Thanks for joining the LitStatus Pro wish list. We will notify you when Pro goes live.</p>";

      const emailTimeout = 5000; // 5 second timeout for email
      const emailPromise = fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [email],
          subject,
          html,
        }),
      });

      void Promise.race([
        emailPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Email timeout")), emailTimeout))
      ]).catch(() => {});

      const notify = process.env.RESEND_NOTIFY_EMAIL;
      if (notify) {
        const notifyPromise = fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [notify],
            subject: `New Pro wish list signup (${lang})`,
            html: `<p>${email} joined the Pro wish list.</p>`,
          }),
        });

        void Promise.race([
          notifyPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Notify timeout")), emailTimeout))
        ]).catch(() => {});
      }
    }

    return NextResponse.json(
      { ok: true },
      { headers: createResponseHeaders(requestId, {
        ...securityHeaders,
        ...createRateLimitHeaders(rateResult),
      }) },
    );
  } catch {
    return NextResponse.json(
      { error: t("Submission failed. Please try again later.", "提交失败。请稍后重试。") },
      { status: 500, headers: createResponseHeaders(requestId, securityHeaders) },
    );
  }
}
