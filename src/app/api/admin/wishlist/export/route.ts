import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSecurityHeaders } from "@/lib/security";
import { requireSignedRequest, SIGNING_HEADERS } from "@/lib/requestSigning";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/security";
import { logSecurityEvent } from "@/lib/securityEvents";

export const runtime = "edge";

const MAX_EXPORT_ROWS = 10000;

type WishlistRow = {
  id: string;
  user_id: string | null;
  email: string;
  note: string | null;
  lang: string;
  variant: string | null;
  created_at: string;
};

function toCsv(rows: WishlistRow[]): string {
  const headers = [
    "id",
    "user_id",
    "email",
    "note",
    "lang",
    "variant",
    "created_at",
  ];
  const escape = (value: string | number | null): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers.map((key) => escape(row[key as keyof WishlistRow])).join(","),
    );
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  const securityHeaders = getSecurityHeaders();

  // Rate limiting first
  const ip = request.headers.get("cf-connecting-ip") ||
             request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             "unknown";
  const rateResult = await checkRateLimit(`admin:export:${ip}`, 10, 60 * 1000);

  if (!rateResult.allowed) {
    await logSecurityEvent({
      event_type: "rate_limited",
      severity: "warn",
      user_id: null,
      ip,
      path: new URL(request.url).pathname,
      user_agent: request.headers.get("user-agent"),
      meta: { endpoint: "admin:export" },
    });
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { ...securityHeaders, ...createRateLimitHeaders(rateResult) },
      },
    );
  }

  // Check for signed request (preferred method)
  const signingSecret = process.env.ADMIN_SIGNING_SECRET;
  if (signingSecret) {
    const signatureCheck = await requireSignedRequest(request, signingSecret);
    if (!signatureCheck.valid) {
      await logSecurityEvent({
        event_type: "admin_signature_invalid",
        severity: "warn",
        user_id: null,
        ip,
        path: new URL(request.url).pathname,
        user_agent: request.headers.get("user-agent"),
        meta: { error: signatureCheck.error },
      });
      return NextResponse.json(
        { error: "Unauthorized", details: signatureCheck.error },
        {
          status: 401,
          headers: securityHeaders,
        },
      );
    }
  } else {
    // Fallback to token-based auth for backward compatibility
    const headerToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();
    const queryToken = new URL(request.url).searchParams.get("token")?.trim();

    const token = headerToken || queryToken;
    const expectedToken = process.env.ADMIN_EXPORT_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: securityHeaders },
      );
    }

    // Constant-time comparison to prevent timing attacks
    // Edge Runtime compatible (no crypto module)
    const timingSafeEqual = (a: string, b: string): boolean => {
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return result === 0;
    };
    if (!token || !timingSafeEqual(token, expectedToken)) {
      await logSecurityEvent({
        event_type: "admin_token_invalid",
        severity: "warn",
        user_id: null,
        ip,
        path: new URL(request.url).pathname,
        user_agent: request.headers.get("user-agent"),
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: securityHeaders },
      );
    }
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("pro_wishlist")
      .select("id,user_id,email,note,lang,variant,created_at")
      .order("created_at", { ascending: false })
      .limit(MAX_EXPORT_ROWS);

    if (error) {
      return NextResponse.json(
        { error: "Export failed" },
        { status: 500, headers: securityHeaders },
      );
    }

    const csv = toCsv((data as WishlistRow[]) ?? []);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=pro_wishlist.csv",
        ...securityHeaders,
        ...createRateLimitHeaders(rateResult),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500, headers: securityHeaders },
    );
  }
}
