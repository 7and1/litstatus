import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  LIMITS,
  SECURITY_HEADERS,
  isValidEmail,
  sanitizeString,
} from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const lang = body?.lang === "zh" ? "zh" : "en";
    const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

    // Get and validate email
    const rawEmail =
      typeof body.email === "string" ? body.email.trim() : user?.email;
    if (!rawEmail) {
      return NextResponse.json(
        { error: t("Email is required to join.", "需要邮箱才能加入。") },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    const email = sanitizeString(rawEmail);
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: t("Invalid email address.", "邮箱地址无效。") },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    // Validate note length
    const note =
      typeof body.note === "string" && body.note.trim()
        ? sanitizeString(body.note).slice(0, LIMITS.MAX_NOTE_LENGTH)
        : null;

    // Validate variant length
    const variant =
      typeof body.variant === "string"
        ? sanitizeString(body.variant).slice(0, LIMITS.MAX_VARIANT_LENGTH)
        : null;

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("pro_wishlist").insert({
      user_id: user?.id ?? null,
      email,
      note,
      lang,
      variant,
    });

    if (error) throw error;

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

      await fetch("https://api.resend.com/emails", {
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
      }).catch(() => null);

      const notify = process.env.RESEND_NOTIFY_EMAIL;
      if (notify) {
        await fetch("https://api.resend.com/emails", {
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
        }).catch(() => null);
      }
    }

    return NextResponse.json({ ok: true }, { headers: SECURITY_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Submission failed. Please try again later." },
      { status: 500, headers: SECURITY_HEADERS },
    );
  }
}
