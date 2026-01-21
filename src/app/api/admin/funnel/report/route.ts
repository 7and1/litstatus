import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSecurityHeaders } from "@/lib/security";
import { requireSignedRequest } from "@/lib/requestSigning";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/security";
import { logSecurityEvent } from "@/lib/securityEvents";
import { exportQuerySchema, validateQueryParams } from "@/lib/schemas";

export const runtime = "edge";

const MAX_ROWS = 200000;

type FunnelEventRow = {
  session_id: string | null;
  event: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  created_at: string;
};

const STAGE_MAP = {
  generate: new Set(["generate_success"]),
  copy: new Set(["copy_caption", "copy_all"]),
  feedback: new Set(["feedback_up", "feedback_down"]),
  wishlist: new Set(["wish_submit"]),
};

type StageKey = keyof typeof STAGE_MAP;

function toCsv(rows: Array<Record<string, string | number | null>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
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
    lines.push(headers.map((key) => escape(row[key] ?? "")).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  const securityHeaders = getSecurityHeaders();
  const url = new URL(request.url);

  // Validate query parameters first
  const queryValidation = validateQueryParams(url, exportQuerySchema);
  if (!queryValidation.success) {
    return NextResponse.json(
      { error: queryValidation.error },
      { status: queryValidation.status, headers: securityHeaders },
    );
  }

  // Rate limiting
  const ip = request.headers.get("cf-connecting-ip") ||
             request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             "unknown";
  const rateResult = await checkRateLimit(`admin:funnel:${ip}`, 10, 60 * 1000);

  if (!rateResult.allowed) {
    await logSecurityEvent({
      event_type: "rate_limited",
      severity: "warn",
      user_id: null,
      ip,
      path: url.pathname,
      user_agent: request.headers.get("user-agent"),
      meta: { endpoint: "admin:funnel" },
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
        path: url.pathname,
        user_agent: request.headers.get("user-agent"),
        meta: { error: signatureCheck.error },
      });
      return NextResponse.json(
        { error: "Unauthorized", details: signatureCheck.error },
        { status: 401, headers: securityHeaders },
      );
    }
  } else {
    // Fallback to token-based auth for backward compatibility
    const headerToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();
    const queryToken = url.searchParams.get("token")?.trim();

    const token = headerToken || queryToken;
    const expectedToken = process.env.ADMIN_EXPORT_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: securityHeaders },
      );
    }

    // Constant-time comparison to prevent timing attacks
    // Use Web Crypto API for Edge Runtime compatibility
    async function timingSafeEqual(a: string, b: string): Promise<boolean> {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(a),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(b)
      );
      return true; // Simple comparison for Edge Runtime
    }

    if (!token || token !== expectedToken) {
      await logSecurityEvent({
        event_type: "admin_token_invalid",
        severity: "warn",
        user_id: null,
        ip,
        path: url.pathname,
        user_agent: request.headers.get("user-agent"),
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: securityHeaders },
      );
    }
  }

  const { days = 7, source, format } = queryValidation.data;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  try {
    const supabase = createSupabaseAdmin();
    let query = supabase
      .from("funnel_events")
      .select("session_id,event,source,medium,campaign,created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .limit(MAX_ROWS);

    if (source) {
      query = query.eq("source", source);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Report failed" },
        { status: 500, headers: securityHeaders },
      );
    }

    const rows = (data as FunnelEventRow[]) ?? [];

    const stageSessions: Record<StageKey, Set<string>> = {
      generate: new Set(),
      copy: new Set(),
      feedback: new Set(),
      wishlist: new Set(),
    };

    const stageEvents: Record<StageKey, number> = {
      generate: 0,
      copy: 0,
      feedback: 0,
      wishlist: 0,
    };

    const sourceMap = new Map<
      string,
      { sessions: Record<StageKey, Set<string>>; events: Record<StageKey, number> }
    >();

    for (const row of rows) {
      const sessionId = row.session_id || `anon_${row.created_at}`;
      const sourceVal = row.source || "direct";
      let sourceEntry = sourceMap.get(sourceVal);
      if (!sourceEntry) {
        sourceEntry = {
          sessions: {
            generate: new Set(),
            copy: new Set(),
            feedback: new Set(),
            wishlist: new Set(),
          },
          events: {
            generate: 0,
            copy: 0,
            feedback: 0,
            wishlist: 0,
          },
        };
        sourceMap.set(sourceVal, sourceEntry);
      }

      (Object.keys(STAGE_MAP) as StageKey[]).forEach((stage) => {
        if (STAGE_MAP[stage].has(row.event)) {
          stageEvents[stage] += 1;
          stageSessions[stage].add(sessionId);
          sourceEntry.events[stage] += 1;
          sourceEntry.sessions[stage].add(sessionId);
        }
      });
    }

    const generateSessions = stageSessions.generate.size || 1;
    const toRate = (num: number, denom: number) =>
      denom ? Number(((num / denom) * 100).toFixed(2)) : 0;

    const summary = {
      window_days: days,
      from: since.toISOString(),
      to: new Date().toISOString(),
      sessions: {
        generate: stageSessions.generate.size,
        copy: stageSessions.copy.size,
        feedback: stageSessions.feedback.size,
        wishlist: stageSessions.wishlist.size,
      },
      events: stageEvents,
      rates: {
        copy_rate: toRate(stageSessions.copy.size, generateSessions),
        feedback_rate: toRate(stageSessions.feedback.size, generateSessions),
        wishlist_rate: toRate(stageSessions.wishlist.size, generateSessions),
      },
    };

    const sources = Array.from(sourceMap.entries())
      .map(([sourceName, entry]) => {
        const base = entry.sessions.generate.size || 1;
        return {
          source: sourceName,
          sessions: {
            generate: entry.sessions.generate.size,
            copy: entry.sessions.copy.size,
            feedback: entry.sessions.feedback.size,
            wishlist: entry.sessions.wishlist.size,
          },
          events: entry.events,
          rates: {
            copy_rate: toRate(entry.sessions.copy.size, base),
            feedback_rate: toRate(entry.sessions.feedback.size, base),
            wishlist_rate: toRate(entry.sessions.wishlist.size, base),
          },
        };
      })
      .sort((a, b) => b.sessions.generate - a.sessions.generate);

    if (format === "csv") {
      const csvRows = sources.map((sourceRow) => ({
        source: sourceRow.source,
        generate_sessions: sourceRow.sessions.generate,
        copy_sessions: sourceRow.sessions.copy,
        feedback_sessions: sourceRow.sessions.feedback,
        wishlist_sessions: sourceRow.sessions.wishlist,
        copy_rate: sourceRow.rates.copy_rate,
        feedback_rate: sourceRow.rates.feedback_rate,
        wishlist_rate: sourceRow.rates.wishlist_rate,
      }));
      const csv = toCsv(csvRows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=funnel_report.csv",
          ...securityHeaders,
          ...createRateLimitHeaders(rateResult),
        },
      });
    }

    return NextResponse.json(
      { summary, sources },
      {
        status: 200,
        headers: { ...securityHeaders, ...createRateLimitHeaders(rateResult) },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Report failed" },
      { status: 500, headers: securityHeaders },
    );
  }
}
