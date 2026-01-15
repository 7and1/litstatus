import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { LIMITS, SECURITY_HEADERS, sanitizeString } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json().catch(() => ({}));

    const rating = Number(body.rating);
    const lang: "en" | "zh" = body?.lang === "zh" ? "zh" : "en";
    const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

    const mode =
      typeof body.mode === "string" ? sanitizeString(body.mode) : null;
    const caption =
      typeof body.caption === "string"
        ? sanitizeString(body.caption).slice(0, LIMITS.MAX_CAPTION_LENGTH)
        : null;
    const hashtags =
      typeof body.hashtags === "string"
        ? sanitizeString(body.hashtags).slice(0, LIMITS.MAX_HASHTAGS_LENGTH)
        : null;
    const detected =
      typeof body.detected_object === "string"
        ? sanitizeString(body.detected_object)
        : null;
    const variant =
      typeof body.variant === "string"
        ? sanitizeString(body.variant).slice(0, LIMITS.MAX_VARIANT_LENGTH)
        : null;

    if (![1, -1].includes(rating)) {
      return NextResponse.json(
        { error: t("Invalid rating.", "无效评分。") },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      rating,
      mode,
      caption,
      hashtags,
      detected_object: detected,
      lang,
      variant,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true }, { headers: SECURITY_HEADERS });
  } catch (error) {
    console.error(
      "[Feedback API Error]",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Feedback failed." },
      { status: 500, headers: SECURITY_HEADERS },
    );
  }
}
