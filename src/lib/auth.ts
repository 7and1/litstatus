import { createSupabaseAdmin } from "./supabaseAdmin";

// Local User type for Edge Runtime compatibility
export type User = {
  id: string;
  email?: string;
};

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
  return data.user as unknown as User;
}
