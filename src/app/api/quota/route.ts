import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getClientIp } from "@/lib/ip";
import { getQuotaStatus } from "@/lib/quota";
import { getSecurityHeaders, checkRateLimit, createRateLimitHeaders } from "@/lib/security";
import { logError } from "@/lib/errors";
import { logSecurityEvent } from "@/lib/securityEvents";
import { generateRequestId, createResponseHeaders } from "@/lib/requestContext";

export const runtime = "edge";

export async function GET(request: Request) {
  const requestId = generateRequestId();
  const securityHeaders = getSecurityHeaders();
  let userId: string | null = null;
  try {
    const user = await getUserFromRequest(request);
    userId = user?.id ?? null;
    const ip = getClientIp(request);

    // Rate limiting
    const identifier = user?.id ?? ip ?? "unknown";
    const rateResult = await checkRateLimit(`quota:${identifier}`, 60, 60 * 1000);

    if (!rateResult.allowed) {
      await logSecurityEvent({
        event_type: "rate_limited",
        severity: "warn",
        user_id: user?.id ?? null,
        ip,
        path: new URL(request.url).pathname,
        user_agent: request.headers.get("user-agent"),
        meta: { endpoint: "quota" },
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

    const status = await getQuotaStatus({ user, ip });
    return NextResponse.json(
      { quota: status },
      { headers: createResponseHeaders(requestId, {
        ...securityHeaders,
        ...createRateLimitHeaders(rateResult),
      }) }
    );
  } catch (error) {
    const appError = error instanceof Error ? error : new Error(String(error));
    logError(appError, {
      userId,
      path: new URL(request.url).pathname,
    });
    return NextResponse.json(
      { error: "Unable to fetch quota status." },
      { status: 500, headers: createResponseHeaders(requestId, securityHeaders) },
    );
  }
}
