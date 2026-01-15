import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim()
        : user?.email;
    const note = typeof body.note === "string" ? body.note.trim() : null;

    if (!email) {
      return NextResponse.json(
        { error: "需要邮箱才能加入。" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("pro_wishlist").insert({
      user_id: user?.id ?? null,
      email,
      note,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "加入失败，请稍后再试。" },
      { status: 500 },
    );
  }
}
