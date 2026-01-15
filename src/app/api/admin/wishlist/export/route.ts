import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SECURITY_HEADERS, constantTimeEqual } from "@/lib/security";

export const runtime = "nodejs";

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
      { status: 500, headers: SECURITY_HEADERS },
    );
  }

  // Use constant-time comparison to prevent timing attacks
  if (!token || !constantTimeEqual(token, expectedToken)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: SECURITY_HEADERS },
    );
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("pro_wishlist")
      .select("id,user_id,email,note,lang,variant,created_at")
      .order("created_at", { ascending: false })
      .limit(MAX_EXPORT_ROWS);

    if (error) {
      console.error("[Admin Export Error]", error.message);
      return NextResponse.json(
        { error: "Export failed" },
        { status: 500, headers: SECURITY_HEADERS },
      );
    }

    const csv = toCsv((data as WishlistRow[]) ?? []);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=pro_wishlist.csv",
        ...SECURITY_HEADERS,
      },
    });
  } catch (error) {
    console.error(
      "[Admin Export Error]",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500, headers: SECURITY_HEADERS },
    );
  }
}
