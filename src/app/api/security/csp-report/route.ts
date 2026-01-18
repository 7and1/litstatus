import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/securityEvents";
import { getSecurityHeaders } from "@/lib/security";
import { getClientIp } from "@/lib/ip";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/security";

export const runtime = "edge";

export async function POST(request: Request) {
  const securityHeaders = getSecurityHeaders();
  const ip = getClientIp(request) || "unknown";

  // Rate limiting for CSP reports to prevent abuse
  const rateResult = await checkRateLimit(`csp-report:${ip}`, 10, 60 * 1000);

  if (!rateResult.allowed) {
    return NextResponse.json(
      { ok: false },
      {
        status: 429,
        headers: { ...securityHeaders, ...createRateLimitHeaders(rateResult) },
      },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const report =
      body?.["csp-report"] ?? body?.report ?? body?.body ?? body ?? {};

    await logSecurityEvent({
      event_type: "csp_violation",
      severity: "warn",
      ip,
      path: request.headers.get("referer") ?? null,
      user_agent: request.headers.get("user-agent"),
      meta: report,
    });

    const resendKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;
    const notify = process.env.RESEND_NOTIFY_EMAIL;

    if (resendKey && resendFrom && notify) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [notify],
          subject: "CSP Violation Report",
          html: `<pre>${JSON.stringify(report, null, 2)}</pre>`,
        }),
      }).catch(() => null);
    }

    return NextResponse.json(
      { ok: true },
      { headers: { ...securityHeaders, ...createRateLimitHeaders(rateResult) } },
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      {
        status: 200,
        headers: { ...securityHeaders, ...createRateLimitHeaders(rateResult) },
      },
    );
  }
}
