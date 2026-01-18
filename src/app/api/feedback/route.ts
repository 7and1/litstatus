import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSecurityHeaders } from "@/lib/security";
import { checkRateLimit, createRateLimitHeaders, sanitizeString, LIMITS } from "@/lib/security";
import { getClientIp } from "@/lib/ip";
import { feedbackInputSchema, validateJsonBody } from "@/lib/schemas";
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
  const rateResult = await checkRateLimit(`feedback:${identifier}`, 20, 60 * 1000);

  if (!rateResult.allowed) {
    await logSecurityEvent({
      event_type: "rate_limited",
      severity: "warn",
      user_id: user?.id ?? null,
      ip,
      path: new URL(request.url).pathname,
      user_agent: request.headers.get("user-agent"),
      meta: { endpoint: "feedback" },
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
  const validation = await validateJsonBody(request, feedbackInputSchema);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status, headers: createResponseHeaders(requestId, securityHeaders) },
    );
  }

  const { rating, mode, caption, hashtags, detected_object, lang, variant } = validation.data;

  // Add timeout for database operation
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), 28000)
  );

  try {
    const supabase = createSupabaseAdmin();
    const dbPromise = supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      rating,
      mode: mode ?? null,
      caption: caption ?? null,
      hashtags: hashtags ?? null,
      detected_object: detected_object ?? null,
      lang,
      variant: variant ?? null,
    });

    const { error } = await Promise.race([dbPromise, timeoutPromise]) as { error: unknown };

    if (error) throw error;

    return NextResponse.json(
      { ok: true },
      { headers: createResponseHeaders(requestId, {
        ...securityHeaders,
        ...createRateLimitHeaders(rateResult),
      }) },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Feedback failed." },
      { status: 500, headers: createResponseHeaders(requestId, securityHeaders) },
    );
  }
}
