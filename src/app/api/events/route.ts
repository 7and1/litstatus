import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getClientIp } from "@/lib/ip";
import { getSecurityHeaders, checkRateLimit, createRateLimitHeaders, sanitizeString } from "@/lib/security";
import { eventInputSchema, validateJsonBody } from "@/lib/schemas";
import { generateRequestId, createResponseHeaders } from "@/lib/requestContext";
import { logSecurityEvent } from "@/lib/securityEvents";

export const runtime = "edge";
export const maxDuration = 30;

const MAX_LEN = {
  source: 120,
  medium: 120,
  campaign: 120,
  content: 120,
  term: 120,
  referrer: 200,
  path: 200,
  session: 120,
  variant: 80,
  mode: 20,
  lang: 10,
};

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const securityHeaders = getSecurityHeaders();
  const ip = getClientIp(request) || "unknown";

  // Add timeout for database operation
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), 28000)
  );

  try {
    // Rate limiting first
    const rate = await checkRateLimit(`events:${ip}`, 120, 60 * 1000);

    if (!rate.allowed) {
      await logSecurityEvent({
        event_type: "rate_limited",
        severity: "warn",
        user_id: null,
        ip,
        path: new URL(request.url).pathname,
        user_agent: request.headers.get("user-agent"),
        meta: { endpoint: "events" },
      });
      return NextResponse.json(
        { error: "Rate limited" },
        {
          status: 429,
          headers: createResponseHeaders(requestId, {
            ...securityHeaders,
            ...createRateLimitHeaders(rate),
          }),
        },
      );
    }

    // Validate request body with Zod
    const validation = await validateJsonBody(request, eventInputSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status, headers: createResponseHeaders(requestId, securityHeaders) },
      );
    }

    const user = await getUserFromRequest(request);
    const { event, props } = validation.data;

    // Sanitize and truncate string props
    const pick = (value: string | undefined, max: number): string | null => {
      if (!value) return null;
      return sanitizeString(value).slice(0, max);
    };

    const sessionId = pick(props?.session_id, MAX_LEN.session);
    const source = pick(props?.source, MAX_LEN.source) ?? "direct";
    const medium = pick(props?.medium, MAX_LEN.medium) ?? "direct";
    const campaign = pick(props?.campaign, MAX_LEN.campaign);
    const content = pick(props?.content, MAX_LEN.content);
    const term = pick(props?.term, MAX_LEN.term);
    const referrer = pick(props?.referrer, MAX_LEN.referrer);
    const path = pick(props?.current_path, MAX_LEN.path) ?? "/";
    const landing = pick(props?.landing_path, MAX_LEN.path) ?? "/";
    const lang = pick(props?.lang, MAX_LEN.lang) ?? "en";
    const variant = pick(props?.variant, MAX_LEN.variant);
    const mode = pick(props?.mode, MAX_LEN.mode);
    const hasImage = props?.has_image === true;

    // Race database operation against timeout
    const supabase = createSupabaseAdmin();
    const dbPromise = supabase.from("funnel_events").insert({
      user_id: user?.id ?? null,
      session_id: sessionId,
      event,
      source,
      medium,
      campaign,
      content,
      term,
      referrer,
      path,
      landing_path: landing,
      lang,
      variant,
      mode,
      has_image: hasImage,
    });

    const { error } = await Promise.race([dbPromise, timeoutPromise]) as { error: unknown };

    if (error) {
      return NextResponse.json(
        { error: "Failed to record" },
        { status: 500, headers: createResponseHeaders(requestId, securityHeaders) },
      );
    }

    return NextResponse.json(
      { ok: true },
      {
        headers: createResponseHeaders(requestId, {
          ...securityHeaders,
          ...createRateLimitHeaders(rate),
        }),
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record" },
      { status: 500, headers: createResponseHeaders(requestId, securityHeaders) },
    );
  }
}
