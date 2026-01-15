import { createSupabaseAdmin } from "./supabaseAdmin";
import type { User } from "@supabase/ssr";

export async function getUserFromRequest(
  request: Request,
): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user;
}
